import React, { useState } from 'react';
import { AlertCircle, Loader2, Video, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';
import { extractVideoRecipe, detectVideoPlatform } from '@/lib/supabase-functions';
import { supabase } from '@/lib/supabase';

interface VideoRecipeExtractorProps {
  onRecipeExtracted: (recipe: ExtractedRecipe) => void;
  userCredits: { web: number; video: number };
}

export function VideoRecipeExtractor({ onRecipeExtracted, userCredits }: VideoRecipeExtractorProps) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleExtract = async () => {
    if (!url.trim()) {
      setError('Lütfen bir video URL\'i girin');
      return;
    }

    if (userCredits.video <= 0) {
      setError('Video çıkarma krediniz kalmadı');
      return;
    }

    const platform = detectVideoPlatform(url);
    if (platform === 'Unknown') {
      setError('Desteklenmeyen platform. YouTube, TikTok, Instagram veya Facebook kullanın.');
      return;
    }

    setLoading(true);
    setError(null);
    setStatus('Video analiz ediliyor... Bu işlem 30-60 saniye sürebilir.');

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Kullanıcı oturumu bulunamadı');
      }

      // Call edge function
      const result = await extractVideoRecipe(url, user.id);
      
      if (result.success && result.recipe) {
        setStatus('Tarif başarıyla çıkarıldı!');
        
        // Pass the extracted recipe to parent component
        onRecipeExtracted(result.recipe);
        setUrl('');
        
        // Show success for 3 seconds
        setTimeout(() => setStatus(''), 3000);
      } else {
        throw new Error(result.error || 'Video işlenemedi');
      }
    } catch (err) {
      console.error('Video extraction error:', err);
      setError(err instanceof Error ? err.message : 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Video className="h-5 w-5" />
          Video'dan Tarif Çıkar
        </h3>
        <p className="text-sm text-muted-foreground">
          YouTube, TikTok, Instagram veya Facebook videolarından tarif çıkarın
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex gap-2">
          <Input
            type="url"
            placeholder="Video URL'ini yapıştırın..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={loading}
            className="flex-1"
          />
          <Button 
            onClick={handleExtract} 
            disabled={loading || userCredits.video <= 0}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                İşleniyor...
              </>
            ) : (
              'Çıkar'
            )}
          </Button>
        </div>

        {/* Platform göstergesi */}
        {url && !loading && (
          <div className="text-sm text-muted-foreground">
            Platform: {detectVideoPlatform(url)}
          </div>
        )}

        {/* Kredi göstergesi */}
        <div className="text-sm text-muted-foreground">
          Kalan video kredisi: {userCredits.video}
        </div>

        {/* Status mesajları */}
        {status && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{status}</AlertDescription>
          </Alert>
        )}

        {/* Hata mesajları */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* İşlem sürüyor uyarısı */}
        {loading && (
          <Alert>
            <AlertDescription>
              Bu işlem biraz sürecek. Uygulamayı arka planda açık tutarak başka şeylerle ilgilenebilirsiniz.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Desteklenen platformlar */}
      <div className="pt-4 border-t">
        <p className="text-xs text-muted-foreground">
          Desteklenen platformlar: YouTube, YouTube Shorts, TikTok, Instagram Reels, Facebook Videos
        </p>
      </div>
    </Card>
  );
}
