# Plan · Stovd Settings Full Build

## Brief
Stovd (ppv3) settings ekranindaki MVP ozellikler (dil, profil, bildirim, yardim) tam/uretim seviyesine cikarilir: reaktif dil degisimi, zengin profil duzenleme, kalici bildirim tercihi ve in-app SSS ekrani.

## Stack
- Expo SDK54 / RN 0.81, expo-router
- i18n-js + expo-localization (loadSavedLocale + setLocale zaten var)
- Supabase (ref mngukcchktjmexinfnib): user_profiles
- @react-native-async-storage/async-storage (persist; ThemeContext pattern)
- lib/theme/ useTheme (dark mode) + Fraunces/Inter + lucide-react-native
- TypeScript (tsc baseline 347)
- expo-notifications: OPSIYONEL (kurulu degil; yoksa sadece tercih persist)

## Scope
**Visuals**
- LanguageSwitcher modal: ThemeSwitcher'i mirror'layan kart, EN/TR satirlari, secili tik, Warm Editorial
- Profil duzenleme: ayri route (app/(protected)/profile-edit) zengin form, onboarding secenek chip'leri reuse
- FAQ: app/(protected)/faq, accordion soru-cevap, Warm Editorial (Fraunces baslik + Inter govde)

**Functionality**
- Dil: secim ANINDA uygulanir (restart yok) - LocaleContext/provider + localeVersion ile component-seviyesi t() yeniden render; AsyncStorage persist; device-default fallback
- Profil: full_name + diyet (allergens, diets, cuisines, cooking skill) + metrik (height/weight/activity) user_profiles'a yazilir/okunur; getCalorieTarget bu veriyi kullanir
- Bildirim: switch AsyncStorage'a persist; varsa expo-notifications izin akisi, yoksa sadece tercih
- Yardim/SSS: in-app /faq ekrani (TR+EN), settings'teki link yerine route push

## Out of Scope
- Avatar / profil fotografi yukleme
- Hesap-verisi disa aktarma (GDPR export)
- Push notification kampanya / zamanlama altyapisi (sadece tercih toggle)
- recipe/[id] + kamera bug'lari (ayri /goal'da cozuldu)
- Paywall "pantry-pal" display name + fiyat (App Store Connect config, kod degil)
- Tema sistemi degisikligi (ThemeSwitcher zaten calisiyor)
- module-level string'lerin (pantry CATEGORIES) restart'siz tam cevirisi (component-ici tasima opsiyonel, zorunlu degil)

## Constraints
- tsc yeni hata eklenmez (baseline 347 sabit veya alti)
- Surgical: sadece ilgili dosyalar; ilgisiz refactor yok
- ppv3'te `git add -A` YASAK (explicit path), .env/secret commit yok
- Warm Editorial korunur: useTheme (dark mode), Fraunces/Inter, lucide ikon (emoji yok), getStyles(colors) factory
- Yeni native modul ZORUNLU degil (expo-notifications opsiyonel; yoksa tercih-persist yeterli)
- i18n key'leri her yeni metin icin EN+TR birlikte eklenir

## Definition of Done
Settings'te dil secimi restart olmadan uygulamanin gorunur dilini aninda degistirir ve kalici olur, profil duzenleme ekrani ad + diyet tercihleri + vucut metriklerini user_profiles'a yazip geri okur, bildirim toggle'i kalici, ve in-app /faq ekrani TR+EN icerik gosterir, hepsi tsc baseline 347'yi asmadan.

## Acceptance Criteria
- Settings -> Dil -> EN/TR secimi RESTART OLMADAN tab bar + settings + ana ekran metinlerini aninda degistirir
- Secilen dil app kill + reopen sonrasi korunur (AsyncStorage)
- LanguageSwitcher secili dili tik ile gosterir, Warm Editorial stilinde
- Settings -> Profil duzenle -> ad + en az bir diyet tercihi + height/weight alanlari var, Kaydet user_profiles'a yazar
- Profil ekrani acilista mevcut user_profiles degerlerini onceden doldurur (geri okuma)
- Bildirim toggle'i degistirilip app kill + reopen sonrasi ayni kalir
- Settings -> Yardim/SSS -> in-app /faq ekrani acilir (web link degil) ve >= 5 soru-cevap, aktif dilde gosterir
- `npx tsc --noEmit` hata sayisi <= 347
- Tum yeni metinler EN + TR i18n key'i tasir (ham key gorunmez)

## Verification
- `cd ~/projects/ppv3 && npx tsc --noEmit 2>&1 | grep -c "error TS"` -> <= 347
- Dil: LocaleContext + provider _layout'ta sariyor; settings'te dil degisince useTranslation tuketen ekranlar re-render (kod) + sim'de tab bar/settings dili aninda degisir; AsyncStorage @stovd_locale yazimi
- Profil: profile-edit user_profiles.update payload'i full_name + dietary + metrics iceriyor (kod); Supabase'de satir guncellendigini dogrula; ekran acilista select ile prefill
- Bildirim: toggle AsyncStorage'a yaziliyor (kod) + reopen'da getItem ile geri okunuyor
- FAQ: /faq route _layout'ta tanimli, accordion render, t() ile TR+EN; settings row router.push('/faq')
- Her ozellik icin simulator/cihaz smoke (build 5'te kullanici dogrular)

## Turn Budget
Stop after 50 turns, or sooner once the DoD condition holds.

## References
- app/(protected)/(tabs)/settings.tsx (mevcut MVP: handleLanguage/openProfileEdit/openHelp)
- lib/i18n/index.ts (t, useTranslation, getLocale, setLocale, loadSavedLocale)
- components/ThemeSwitcher.tsx + contexts/ThemeContext.tsx (modal + AsyncStorage persist mirror)
- app/(auth)/onboarding.tsx (diyet/allergen/cuisine/skill secenek listeleri reuse)
- app/_layout.tsx (provider sarma noktasi)
- lib/nutrition + getCalorieTarget (profil metrikleri tuketicisi)
- commit dd25b48 (settings MVP)

## Risks / Open Questions
- Reaktif dil: i18n-js locale degisimi otomatik re-render tetiklemez; useTranslation'i bir LocaleContext'e baglayip localeVersion bump ederek cozulmeli. Module-load'da cozulen sabitler (pantry CATEGORIES, UNITS) restart'siz guncellenmez - component-ici useMemo'ya tasima opsiyonel; tasinmazsa o birkac etiket restart sonrasi degisir (kabul edilebilir, AC bu ekranlari zorunlu kosmuyor).
- expo-notifications kurulu degil: kurmak prebuild/native build gerektirir; plan once sadece tercih-persist yapar, gercek bildirim izni opsiyonel ikinci adim.
- profile-edit + onboarding option listelerinin ortak kaynaga cikarilmasi gerekebilir (duplikasyon riski); ortak bir lib/profile/options.ts'e al.

## Progress (live - /goal run 2026-06-08)
DoD kod-tarafi TAMAM. tsc 347 sabit (gate OK, sifir yeni hata). Metro 8081 web bundle: LocaleContext + profile-edit + faq + LanguageSwitcher hepsi HTTP 200 temiz transform (runtime-grade).

- [x] REAKTIF DIL: yeni `contexts/LocaleContext.tsx` (LocaleProvider + useLocale + reaktif useTranslation). `i18n.locale` global mutable kaliyor; provider state + setLocale ile abone component'ler aninda re-render. `app/_layout.tsx` LocaleProvider ile root sariyor (SafeAreaProvider>LocaleProvider>ThemeProvider). 6 gorunur ekran abone: tab `_layout` + settings + index + pantry + recipes + shopping-list (`const { t } = useTranslation()`, mevcut import'a dokunulmadi, component-ici shadow). Modul-seviyesi sabitler (pantry CATEGORIES/UNITS) restart'siz degismez — AC bunlari zorunlu kosmuyor (kabul).
- [x] LanguageSwitcher (`components/LanguageSwitcher.tsx`): ThemeSwitcher mirror bottom-sheet, EN/TR + secili Check, useLocale().setLocale ile aninda + kalici (AsyncStorage @stovd_locale, setLocale zaten persist ediyordu). Settings dil satiri Alert yerine bu modali aciyor. Restart-prompt KALDIRILDI.
- [x] PROFIL TAM DUZENLEME: yeni route `app/(protected)/profile-edit.tsx` (zengin form). Okur+yazar: full_name + dietary_preferences + dietary_restrictions(allergens) + cuisine_preferences + cooking_skill_level + activity_level + height_cm + weight_kg. Acilista user_profiles'tan prefill (select), Kaydet update. Option key'leri onboarding ile ayni (yeni `lib/profile/options.ts`, label'lar mevcut auth.onboarding.* i18n — yeni i18n gerekmedi). Settings'teki isim-only modal KALDIRILDI (route'a tasindi), olu modal stilleri temizlendi.
- [x] BILDIRIM PERSIST: settings switch artik AsyncStorage `@stovd_notifications`'a yaziyor, mount'ta geri okuyor (toggleNotifications). expo-notifications KURULU DEGIL → sadece tercih-persist (constraint: yeni native modul zorunlu degil).
- [x] IN-APP SSS: yeni route `app/(protected)/faq.tsx` (accordion, Warm Editorial, Fraunces baslik + Inter govde). Icerik `lib/faq/content.ts` (8 EN + 8 TR Q&A, locale'e gore reaktif). Settings Yardim/SSS artik stovd.app/faq linki yerine router.push('/faq'). `(protected)/_layout.tsx`'e profile-edit + faq Stack.Screen (slide).
- i18n: settings.ts'e profil-editor + faq ekran chrome string'leri (EN+TR) eklendi. tsc 347.
- KALAN: build 5 + cihaz smoke (dil aninda flip gozle teyit — plan Verification geregi kullanici build 5'te). Commit henuz YAPILMADI (kullanici onayi bekliyor; ppv3'te `git add -A` YASAK, explicit path).
