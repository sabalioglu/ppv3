# Plan · Stovd Build 13 Bugfix Turu

## Brief
Build 12 cihaz testinde bulunan pantry/cookbook bug'larini kapatip tek seferde build 13 kesmek. Kullanici test ettikce yeni bug ekleyecek - bu dosya o turun tek listesi.

## Stack
- Expo SDK54 / RN 0.81, expo-router, ~/projects/ppv3 branch main
- Supabase ref mngukcchktjmexinfnib (DB degisikligi gerekmiyor bu turda)
- EAS build production profile + --auto-submit (build 13)

## Scope

**Bug listesi (durum etiketli):**

- [ ] **B1 - Unit dropdown "Piece"de sabit** (`app/(protected)/(tabs)/pantry.tsx`)
  Kok neden BULUNDU: `renderUnitDropdown()` (satir 1047, `<Modal>`) Add-Item modal'inin DISINDA, ekran kokunde kardes olarak render ediliyor (satir 1177). iOS bir Modal acikken kardes ikinci Modal'i sessizce present ETMIYOR (kameradaki Modal-over-CameraView ile ayni sinif). Fix: `{renderUnitDropdown()}` cagrisini `renderAddItemModal` icine, kapanis `</Modal>`'dan hemen once tasi (ic ice Modal iOS'ta calisir). Edit modal ayni formu kullaniyorsa o yol da kapsanmis olur.
- [x] **B2 - Kameradan eklenen urun pantry'de gorunmuyor** (patates) - commit `393ef42`
  Insert DB'ye BASARILI gidiyor (payload canli semayla diff'lendi, temiz; "2 items added" gercek success). Liste mount-only fetch oldugu icin gorunmuyordu. Fix: `useFocusEffect` ile her odakta refetch. Build 12'de dogrulama: app'i tamamen kapatip ac VEYA listeyi asagi cek-birak -> patates gorunmeli. Gorunmezse B2 yeniden acilir (Supabase log incelemesi).
- [x] **B3 - Pantry aramada her harfte klavye kapaniyor** - commit `393ef42`
  `ListHeaderComponent={renderCategoriesHeader}` function-ref her render'da yeni kimlik -> header remount -> TextInput blur. Fix: element olarak gecildi + `keyboardShouldPersistTaps="handled"`.
- [x] **B4 - Cookbook olusuyor ama listede gorunmuyor** - commit `393ef42`
  `useCookbookManager.loadCookbooks` prod'da olmayan `cookbook_with_stats` view'ini soruyordu; fallback string PostgREST mesajiyla eslesmiyordu -> liste hep bos. Fix: dogrudan `cookbooks` + embedded `recipe_cookbooks(count)`. Ayrica `createCookbook`'tan phantom `is_public` kaldirildi.
- [x] **B5 - Create Cookbook formu klavye altinda kaliyor** - commit `393ef42`
  BottomSheet'e `keyboardBehavior="extend"` + `keyboardBlurBehavior="restore"` + android `adjustResize` + spacer 320.

**Kullanici ekledikce (bos slotlar):**
- [ ] B6 - ...
- [ ] B7 - ...

## Out of Scope
- Redesign D mega-dosya bolme (pantry.tsx zaten 500+ satir ama bu turda refactor YOK, sadece surgical fix)
- Meal|Recipe union-type debt (baseline 340'in cogu)
- Store config isleri (ASC IAP, Paid Apps, Play $25, RC production key) - kullanici elinde
- git push + R2 yedek - ayri operasyon
- Kamera vision kalitesi / unit tahmini (kamera eklemeleri hep `unit: 'piece'` yaziyor - bilincli sadelik, bug degil)

## Constraints
- tsc <= 340 (yeni hata yok), `grep -c "error TS"` ile dogrula
- Surgical: sadece ilgili dosyalar, stil/format refactor yok
- ppv3'te `git add -A` YASAK - explicit path
- Yeni metin gerekirse EN+TR i18n
- Build 13 SADECE kullanici "build 13'u baslat" deyince kesilir (tum bug'lar toplanana kadar bekle)

## Definition of Done
Listedeki tum acik bug'lar commit'lenmis, tsc 340'i asmiyor ve kullanici onayiyla kesilen build 13 TestFlight'a submit edilmis durumda.

## Acceptance Criteria
- B1: Unit alanina dokununca picker acilir, secim "Piece" disinda bir degere degisir ve Add ile DB'ye o unit yazilir
- B2: Kameradan eklenen urun, pantry tab'ina donunce refetch ile listede gorunur (restart gerekmez)
- B3: Pantry aramasinda 5+ harf pes pese yazilirken klavye acik kalir
- B4: Yeni cookbook olusturulunca My Cookbooks satirinda aninda gorunur
- B5: Create Cookbook'ta klavye acikken Emoji + Color bolumlerine scroll ile erisilir
- tsc hata sayisi <= 340
- Dokunulan her dosya icin commit mesajinda kok neden bir cumleyle yazili
- Build 13 EAS'te yesil + auto-submit "Submitted to App Store Connect" ciktisi

## Verification
- `cd ~/projects/ppv3 && npx tsc --noEmit 2>&1 | grep -c "error TS"` -> <= 340
- B1 kod dogrulamasi: `grep -n "renderUnitDropdown()" app/"(protected)"/"(tabs)"/pantry.tsx` tek sonuc ve Add-Item Modal blogu ICINDE
- Cihaz dogrulamasi build 13'te kullanici tarafindan (B1-B5 acceptance maddeleri)
- Build: `eas build --platform ios --profile production --non-interactive --auto-submit` (run_in_background), `eas build:list --json` ile status=FINISHED + buildNumber=13

## Turn Budget
Stop after 20 turns, or sooner once the DoD condition holds.

## Risks / Open Questions
- B2 supheli kalirsa: patates satirinin DB'de olup olmadigi build 12'de app restart ile aninda test edilebilir; restart sonrasi da yoksa insert path'i yeniden acilir (vision item adlari "Potato" olmayabilir - tam listeyi kontrol et)
- B1 nested-Modal fix'i Android'de regresyon yaratmamali (Android nested Modal destekler, dusuk risk)
- pantry.tsx buyuk dosya - edit'lerde satir kaymasina dikkat, her edit oncesi guncel oku
