// camera strings. en = primary (displayed by default), tr = secondary.
export default {
  en: {
    // Mode chips
    modeFoodRecognition: 'FOOD',
    modeMultiple: 'MULTI',
    modeCalorie: 'CALORIE',
    modeReceipt: 'RECEIPT',

    // Permission
    permissionEyebrow: 'Kitchen camera',
    permissionTitle: 'We need access to your camera',
    permissionText:
      'We need camera access so we can scan what you have and your receipts and add them to your pantry.',
    permissionGrant: 'Allow access',

    // Tutorial
    tutorialEyebrow: 'Scan modes',
    tutorialTitle: 'What can the camera do?',
    tutorialFood: 'Recognizes ingredients',
    tutorialCalorie: 'Calculates nutrition',
    tutorialMultiple: 'Processes photos in bulk',
    tutorialReceipt: 'Smartly fills your pantry',

    // Scan pipeline steps
    stepCapturing: 'Capturing…',
    stepOptimizing: 'Optimizing photo…',
    loadingFood: 'Analyzing food…',
    loadingCalorie: 'Calculating nutrition…',
    loadingMultiple: 'Processing photos…',
    loadingReceipt: 'Reading your receipt…',
    analyzingCount: 'Analyzing %{done}/%{total}…',
    analysisTimeout:
      'Analysis timed out. Check your connection and try again.',
    scanFailedTitle: 'Scan failed',
    noPhotosTitle: 'No photos',
    noPhotosMessage: 'Take a few photos first',

    // Multiple images counter
    photosCount: 'photos',
    analyze: 'Analyze',
    imagesAnalyzed: 'Images Analyzed',
    noItemsDetected: 'No items detected',
    found: 'Found',
    items: 'items',
    addAllToPantry: 'Add all to pantry',
    tryClearerPhotos: 'Try clearer photos',

    // Add-to-inventory modal
    inventoryEyebrow: 'Smart receipt',
    inventoryTitle: 'Confirm items',
    inventoryReview: 'Found %{count} items. Please review and confirm:',
    inventoryStats:
      '%{confirmed} confirmed · %{rejected} rejected · %{edited} edited',
    inventoryNotNow: 'Not now',
    inventoryAddItems: 'Add %{count} items',
    inventoryFooter: 'Your feedback improves the AI',
    editItemTitle: 'Edit Item Name',
    editItemCurrent: 'Current: %{name}',

    // addToInventory alerts
    noItemsTitle: 'No items selected',
    noItemsMessage: 'Confirm a few items first',
    addedTitle: 'Added',
    addedMessage: '%{count} items added to your pantry!',
    addedGreat: 'Great',
    addErrorTitle: 'Error',
    addErrorMessage: 'Could not add items. Please try again.',

    // Results modal
    resultEyebrow: 'Scan result',
    nutritionTitle: 'Nutrition',
    calories: 'Calories',
    protein: 'Protein',
    carbs: 'Carbs',
    fat: 'Fat',
    foundItems: 'Items found',
    suggestions: 'Suggestions',
    extractedText: 'Extracted text',
    addAll: 'Add all',
    addAllConfirmMessage: 'Add %{count} items to your pantry?',
    addAllCancel: 'Cancel',
  },
  tr: {
    // Mode chips
    modeFoodRecognition: 'YEMEK',
    modeMultiple: 'ÇOKLU',
    modeCalorie: 'KALORİ',
    modeReceipt: 'FİŞ',

    // Permission
    permissionEyebrow: 'Mutfak kamerası',
    permissionTitle: 'Kamerana erişmemiz gerek',
    permissionText:
      'Elindekileri ve fişlerini tarayıp kilerine ekleyebilmemiz için kamera iznine ihtiyacımız var.',
    permissionGrant: 'İzin ver',

    // Tutorial
    tutorialEyebrow: 'Tarama modları',
    tutorialTitle: 'Kamera ne yapabilir?',
    tutorialFood: 'Malzemeleri tanır',
    tutorialCalorie: 'Besin değerini hesaplar',
    tutorialMultiple: 'Toplu fotoğraf işler',
    tutorialReceipt: 'Kilerini akıllıca doldurur',

    // Scan pipeline steps
    stepCapturing: 'Fotoğraf çekiliyor…',
    stepOptimizing: 'Fotoğraf hazırlanıyor…',
    loadingFood: 'Yemek inceleniyor…',
    loadingCalorie: 'Besin değeri hesaplanıyor…',
    loadingMultiple: 'Fotoğraflar işleniyor…',
    loadingReceipt: 'Fişin okunuyor…',
    analyzingCount: '%{done}/%{total} analiz ediliyor…',
    analysisTimeout:
      'Analiz zaman aşımına uğradı. Bağlantını kontrol edip tekrar dene.',
    scanFailedTitle: 'Tarama başarısız',
    noPhotosTitle: 'Fotoğraf yok',
    noPhotosMessage: 'Önce birkaç fotoğraf çek',

    // Multiple images counter
    photosCount: 'fotoğraf',
    analyze: 'Analiz et',
    imagesAnalyzed: 'Görsel Analiz Edildi',
    noItemsDetected: 'Ürün algılanmadı',
    found: 'Bulundu',
    items: 'ürün',
    addAllToPantry: 'Hepsini kilere ekle',
    tryClearerPhotos: 'Daha net fotoğraf çekin',

    // Add-to-inventory modal
    inventoryEyebrow: 'Akıllı fiş',
    inventoryTitle: 'Ürünleri onayla',
    inventoryReview: '%{count} ürün bulundu. Lütfen gözden geçirip onayla:',
    inventoryStats:
      '%{confirmed} onaylandı · %{rejected} reddedildi · %{edited} düzenlendi',
    inventoryNotNow: 'Şimdi değil',
    inventoryAddItems: '%{count} ürün ekle',
    inventoryFooter: 'Geri bildirimin yapay zekâyı geliştiriyor',
    editItemTitle: 'Ürün Adını Düzenle',
    editItemCurrent: 'Mevcut: %{name}',

    // addToInventory alerts
    noItemsTitle: 'Ürün seçilmedi',
    noItemsMessage: 'Önce birkaç ürünü onayla',
    addedTitle: 'Eklendi',
    addedMessage: '%{count} ürün kilerine eklendi!',
    addedGreat: 'Harika',
    addErrorTitle: 'Hata',
    addErrorMessage: 'Ürünler eklenemedi. Lütfen tekrar dene.',

    // Results modal
    resultEyebrow: 'Tarama sonucu',
    nutritionTitle: 'Besin değeri',
    calories: 'Kalori',
    protein: 'Protein',
    carbs: 'Karbonhidrat',
    fat: 'Yağ',
    foundItems: 'Bulunan ürünler',
    suggestions: 'Öneriler',
    extractedText: 'Okunan metin',
    addAll: 'Tümünü ekle',
    addAllConfirmMessage: '%{count} ürün kilerine eklensin mi?',
    addAllCancel: 'Vazgeç',
  },
};
