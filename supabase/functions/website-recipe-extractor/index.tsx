// supabase/functions/website-recipe-extractor/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { VertexAI } from 'npm:@google-cloud/vertexai@^1.0.0'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const vertexAI = new VertexAI({
  project: Deno.env.get('GCP_PROJECT_ID')!,
  location: 'us-central1',
  googleAuthOptions: {
    credentials: JSON.parse(Deno.env.get('GCP_SERVICE_ACCOUNT_KEY')!)
  }
});

const model = vertexAI.getGenerativeModel({
  model: 'gemini-1.5-pro-preview-0514'
});

interface WebsiteExtractionRequest {
  url: string;
  userId: string;
}

interface RecipeData {
  title: string;
  description?: string;
  ingredients: Array<{
    name: string;
    quantity?: string;
    unit?: string;
  }>;
  instructions: Array<{
    step: number;
    instruction: string;
  }>;
  prep_time?: number;
  cook_time?: number;
  servings?: number;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  nutrition?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };
  tags: string[];
  image_url?: string;
  confidence_score: number;
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { url, userId }: WebsiteExtractionRequest = await req.json();
    
    if (!url || !userId) {
      return new Response('URL and userId are required', { status: 400 });
    }

    console.log(`🌐 [WEBSITE-EXTRACTOR] Starting analysis for ${url}, user: ${userId}`);

    // Validate URL
    try {
      new URL(url);
    } catch {
      return new Response('Invalid URL format', { status: 400 });
    }

    const jobId = generateJobId();
    const startTime = Date.now();
    
    // Process website asynchronously
    processWebsiteAsync({ jobId, url, userId, startTime });
    
    return new Response(JSON.stringify({
      success: true,
      jobId,
      message: 'Web sitesi analizi başlatıldı',
      estimatedTime: '15-30 saniye',
      type: 'website'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('❌ [WEBSITE-EXTRACTOR] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    });
  }
});

async function processWebsiteAsync(job: {
  jobId: string;
  url: string;
  userId: string;
  startTime: number;
}): Promise<void> {
  try {
    // Step 1: Initialize job
    await updateJobStatus(job.jobId, 'analyzing', 25, 'Web sitesi AI ile analiz ediliyor...');
    
    // Step 2: AI Analysis
    const recipeData = await extractRecipeWithGemini(job.url);
    
    await updateJobStatus(job.jobId, 'validating', 60, 'Tarif bilgileri doğrulanıyor...');
    
    // Step 3: Validation
    validateRecipeData(recipeData);
    
    await updateJobStatus(job.jobId, 'saving', 80, 'Tarif kütüphaneye kaydediliyor...');
    
    // Step 4: Save to user library
    const savedRecipe = await saveRecipeToLibrary(recipeData, job.userId, job.url);
    
    const processingTime = Date.now() - job.startTime;
    
    // Step 5: Complete
    await updateJobStatus(job.jobId, 'completed', 100, 'Web sitesi tarifi başarıyla kaydedildi!', {
      recipeId: savedRecipe.id,
      title: recipeData.title,
      processingTime,
      confidence: recipeData.confidence_score
    });
    
    // Step 6: Real-time notification
    await supabase
      .channel(`user:${job.userId}`)
      .send({
        type: 'broadcast',
        event: 'recipe_extracted',
        payload: {
          jobId: job.jobId,
          recipeId: savedRecipe.id,
          title: recipeData.title,
          sourceType: 'website',
          processingTime
        }
      });
    
    console.log(`✅ [WEBSITE-EXTRACTOR] Job ${job.jobId} completed in ${processingTime}ms`);
    
  } catch (error) {
    console.error(`❌ [WEBSITE-EXTRACTOR] Job ${job.jobId} failed:`, error);
    
    await updateJobStatus(job.jobId, 'failed', 0, getWebsiteErrorMessage(error, job.url), {
      error: error.message,
      url: job.url
    });
  }
}

async function extractRecipeWithGemini(url: string): Promise<RecipeData> {
  const analysisPrompt = `
    Bu web sitesindeki tarifi detaylı analiz et ve JSON formatında çıkar:
    URL: ${url}
    
    ÇIKARILACAK BİLGİLER:
    1. Tarif başlığı (web sitesinde tam olarak yazılan)
    2. Malzemeler (miktar, birim ve isim ayrı ayrı)
    3. Pişirme adımları (numaralı liste halinde)
    4. Hazırlık ve pişirme süreleri (dakika cinsinden)
    5. Porsiyon sayısı
    6. Zorluk seviyesi (Easy/Medium/Hard)
    7. Beslenme bilgileri (varsa)
    8. İlgili etiketler
    9. Tarif görseli URL'si
    
    KRİTİK KURALLAR:
    - Sadece web sitesinde NET OLARAK görünen bilgileri kullan
    - Emin olmadığın bilgiler için null döndür
    - Uydurma, tahmin etme veya tamamlama yapma
    - Güven skorunu gerçekçi hesapla (0-100)
    - Malzemeler listesi en az 2 öğe içermeli
    - Adımlar listesi en az 2 adım içermeli
    
    JSON Formatı (kesinlikle bu yapıya uy):
    {
      "title": "string",
      "description": "string|null",
      "ingredients": [
        {
          "name": "string",
          "quantity": "string|null",
          "unit": "string|null"
        }
      ],
      "instructions": [
        {
          "step": 1,
          "instruction": "string"
        }
      ],
      "prep_time": "number|null",
      "cook_time": "number|null",
      "servings": "number|null",
      "difficulty": "Easy|Medium|Hard|null",
      "nutrition": {
        "calories": "number|null",
        "protein": "number|null",
        "carbs": "number|null",
        "fat": "number|null"
      },
      "tags": ["string"],
      "image_url": "string|null",
      "confidence_score": "number (0-100)"
    }
    
    UYARI: Güven skoru 80'in altındaysa "Düşük güven skoru" hatası ver.
    Eksik veya belirsiz bilgiler varsa confidence_score'u düşür.
  `;
  
  console.log(`🤖 [GEMINI] Analyzing website: ${url}`);
  
  const result = await model.generateContent({
    contents: [{
      role: 'user',
      parts: [{ text: analysisPrompt }]
    }]
  });
  
  const responseText = result.response.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!responseText) {
    throw new Error('Gemini boş yanıt döndürdü');
  }
  
  console.log(`🤖 [GEMINI] Response received, parsing JSON...`);
  
  let recipeData: RecipeData;
  try {
    recipeData = JSON.parse(responseText);
  } catch (parseError) {
    console.error('JSON parse error:', parseError);
    throw new Error('AI yanıtı geçerli JSON formatında değil');
  }
  
  // Confidence validation (Manifesto compliance)
  if (recipeData.confidence_score < 80) {
    throw new Error(`Düşük güven skoru: ${recipeData.confidence_score}%. Web sitesi net tarif bilgisi içermiyor.`);
  }
  
  console.log(`✅ [GEMINI] Recipe extracted with confidence: ${recipeData.confidence_score}%`);
  
  return recipeData;
}

function validateRecipeData(recipeData: RecipeData): void {
  // Essential fields validation (Anti-hallucination)
  if (!recipeData.title || recipeData.title.trim().length < 3) {
    throw new Error('Geçersiz tarif başlığı');
  }
  
  if (!recipeData.ingredients || recipeData.ingredients.length < 2) {
    throw new Error('Yetersiz malzeme bilgisi (en az 2 malzeme gerekli)');
  }
  
  if (!recipeData.instructions || recipeData.instructions.length < 2) {
    throw new Error('Yetersiz adım bilgisi (en az 2 adım gerekli)');
  }
  
  // Ingredient validation
  const validIngredients = recipeData.ingredients.every(ingredient => 
    ingredient.name && ingredient.name.trim().length > 1
  );
  
  if (!validIngredients) {
    throw new Error('Geçersiz malzeme bilgileri');
  }
  
  // Instructions validation
  const validInstructions = recipeData.instructions.every(instruction =>
    instruction.instruction && instruction.instruction.trim().length > 5
  );
  
  if (!validInstructions) {
    throw new Error('Geçersiz adım bilgileri');
  }
}

async function saveRecipeToLibrary(recipeData: RecipeData, userId: string, sourceUrl: string): Promise<any> {
  const { data: savedRecipe, error: dbError } = await supabase
    .from('user_recipes')
    .insert({
      user_id: userId,
      title: recipeData.title,
      description: recipeData.description,
      image_url: recipeData.image_url,
      prep_time: recipeData.prep_time,
      cook_time: recipeData.cook_time,
      servings: recipeData.servings,
      difficulty: recipeData.difficulty,
      ingredients: recipeData.ingredients,
      instructions: recipeData.instructions,
      nutrition: recipeData.nutrition,
      tags: recipeData.tags,
      category: 'Web Recipe',
      is_ai_generated: true,
      ai_confidence_score: recipeData.confidence_score,
      source_url: sourceUrl,
      source_platform: detectWebsitePlatform(sourceUrl),
      extraction_method: 'ai_direct',
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (dbError) {
    console.error('Database error:', dbError);
    throw new Error(`Veritabanı hatası: ${dbError.message}`);
  }

  return savedRecipe;
}

function detectWebsitePlatform(url: string): string {
  try {
    const domain = new URL(url).hostname.toLowerCase();
    
    if (domain.includes('allrecipes.com')) return 'AllRecipes';
    if (domain.includes('food.com')) return 'Food.com';
    if (domain.includes('foodnetwork.com')) return 'Food Network';
    if (domain.includes('nefisyemektarifleri.com')) return 'Nefis Yemek Tarifleri';
    if (domain.includes('yemek.com')) return 'Yemek.com';
    
    return 'Recipe Website';
  } catch {
    return 'Unknown Website';
  }
}

async function updateJobStatus(jobId: string, status: string, progress: number, message: string, data?: any): Promise<void> {
  await supabase
    .from('recipe_processing_jobs')
    .upsert({
      job_id: jobId,
      status,
      progress,
      message,
      data: { ...(data || {}), timestamp: new Date().toISOString() },
      updated_at: new Date().toISOString()
    });
}

function generateJobId(): string {
  return `web_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function getWebsiteErrorMessage(error: any, url: string): string {
  const domain = new URL(url).hostname.toLowerCase();
  
  if (error.message?.includes('Düşük güven skoru')) {
    return 'Web sitesi net tarif bilgisi içermiyor. Lütfen daha detaylı bir tarif sitesi deneyin.';
  } else if (error.message?.includes('Yetersiz malzeme')) {
    return 'Web sitesinde yeterli malzeme bilgisi bulunamadı.';
  } else if (error.message?.includes('Yetersiz adım')) {
    return 'Web sitesinde yeterli pişirme adımı bulunamadı.';
  } else if (error.message?.includes('Gemini boş yanıt')) {
    return 'AI analizi başarısız. Web sitesi erişilebilir değil veya tarif içermiyor.';
  } else if (error.message?.includes('JSON formatında değil')) {
    return 'AI analizi başarısız. Lütfen farklı bir tarif sitesi deneyin.';
  } else {
    return `${domain} sitesi analiz edilemedi. Lütfen farklı bir tarif sitesi deneyin.`;
  }
}
