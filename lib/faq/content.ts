// lib/faq/content.ts — in-app Help & FAQ content (EN + TR).
//
// Kept as plain typed data (not i18n-js keys) because i18n-js is awkward with
// arrays of objects. The FAQ screen selects the list by the active locale, so
// it re-renders on a language switch like any other reactive screen.
import type { AppLocale } from '@/lib/i18n';

export interface FaqItem {
  q: string;
  a: string;
}

export const FAQ: Record<AppLocale, readonly FaqItem[]> = {
  en: [
    {
      q: 'What is Stovd?',
      a: 'Stovd turns what you already have into meals. Add your pantry, and Stovd suggests recipes you can actually cook right now, plus AI meal plans tailored to your goals.',
    },
    {
      q: 'How do I add items to my pantry?',
      a: 'Tap the Scan button in the center of the tab bar. Snap a photo of a single item, multiple items, or a receipt, and Stovd detects and adds them. You can also add items by hand from the Pantry tab.',
    },
    {
      q: 'How do recipe suggestions work?',
      a: 'Stovd matches recipes against what is in your pantry and highlights which ingredients you already own versus what you are missing, so you can cook with what you have.',
    },
    {
      q: 'What does Premium include?',
      a: 'Premium unlocks unlimited AI photo scans, recipe imports, and weekly/monthly AI meal plans. Free accounts include a generous monthly allowance. You can subscribe from Settings → Go Premium.',
    },
    {
      q: 'Can I change the app language?',
      a: 'Yes. Go to Settings → Language and choose English or Türkçe. The change applies immediately, no restart needed.',
    },
    {
      q: 'How do I edit my dietary preferences?',
      a: 'Open Settings → Edit profile. You can update your name, diets, allergens, preferred cuisines, cooking skill, and body metrics. Meal plans use these to tailor portions and suggestions.',
    },
    {
      q: 'How is my data handled?',
      a: 'Your pantry, recipes, and profile are stored in your account. You can permanently delete your account and all related data anytime from Settings → Delete account.',
    },
    {
      q: 'I found a bug or have a suggestion.',
      a: 'We would love to hear it. Use Settings → Send feedback to email us directly, and please include a screenshot if it helps.',
    },
  ],
  tr: [
    {
      q: 'Stovd nedir?',
      a: 'Stovd elindekileri yemeğe dönüştürür. Kilerini ekle; Stovd şu an gerçekten pişirebileceğin tarifleri ve hedeflerine göre AI öğün planlarını önersin.',
    },
    {
      q: 'Kilerime nasıl ürün eklerim?',
      a: 'Alt menünün ortasındaki Tara butonuna dokun. Tek ürün, birden çok ürün ya da bir fişin fotoğrafını çek; Stovd ürünleri tanıyıp ekler. Ayrıca Kiler sekmesinden elle de ekleyebilirsin.',
    },
    {
      q: 'Tarif önerileri nasıl çalışır?',
      a: 'Stovd tarifleri kilerindekilerle eşleştirir; hangi malzemelere sahip olduğunu ve hangilerinin eksik olduğunu gösterir; böylece elindekiyle pişirirsin.',
    },
    {
      q: 'Premium neleri kapsar?',
      a: 'Premium sınırsız AI foto tarama, tarif içe aktarma ve haftalık/aylık AI öğün planlarını açar. Ücretsiz hesaplarda cömert bir aylık kota vardır. Ayarlar → Premium’a Geç ile abone olabilirsin.',
    },
    {
      q: 'Uygulama dilini değiştirebilir miyim?',
      a: 'Evet. Ayarlar → Dil bölümünden English veya Türkçe seç. Değişiklik anında uygulanır, yeniden başlatma gerekmez.',
    },
    {
      q: 'Diyet tercihlerimi nasıl düzenlerim?',
      a: 'Ayarlar → Profili Düzenle’yi aç. Adını, diyetlerini, alerjenlerini, sevdiğin mutfakları, yemek pişirme seviyeni ve vücut ölçülerini güncelleyebilirsin. Öğün planları porsiyon ve önerileri buna göre ayarlar.',
    },
    {
      q: 'Verilerim nasıl işleniyor?',
      a: 'Kilerin, tariflerin ve profilin hesabında saklanır. Ayarlar → Hesabı Sil ile hesabını ve ilgili tüm verini istediğin zaman kalıcı olarak silebilirsin.',
    },
    {
      q: 'Bir hata buldum veya önerim var.',
      a: 'Duymak isteriz. Ayarlar → Geri Bildirim Gönder ile bize doğrudan e-posta at; yardımcı olacaksa ekran görüntüsü eklemen iyi olur.',
    },
  ],
};
