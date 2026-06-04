// shopping list strings. en = primary (displayed by default), tr = secondary.
export default {
  en: {
    eyebrow: 'Kitchen Notebook',
    title: 'Shopping List',
    subtitle: '%{pending} pending • %{completed} done',
    loading: 'Loading your shopping list…',

    // compact stats
    statItems: 'Items',
    statCost: 'Total',
    statDone: 'Done',

    searchPlaceholder: 'Search…',

    // quick actions / toggles
    quickActions: 'Quick Actions',
    tabPending: 'Pending (%{count})',
    tabCompleted: 'Completed (%{count})',
    addFromPantry: 'Add from Pantry',
    clearCompleted: 'Clear Completed (%{count})',

    // filter sections
    sectionCategories: 'Categories',
    sectionPriority: 'Priority',

    // categories (display labels)
    catAll: 'All',
    catFruits: 'Fruits',
    catVegetables: 'Vegetables',
    catDairy: 'Dairy',
    catMeat: 'Meat',
    catGrains: 'Grains',
    catSnacks: 'Snacks',
    catBeverages: 'Beverages',
    catGeneral: 'General',

    // priorities (display labels)
    prioLow: 'Low',
    prioMedium: 'Medium',
    prioHigh: 'High',
    prioUrgent: 'Urgent',

    // empty state
    emptyCompletedTitle: 'Nothing completed',
    emptyTitle: 'Your list is empty',
    emptyCompletedSubtitle: 'Items show up here as you check them off.',
    emptySubtitle:
      'Add what your kitchen needs and we’ll get you ready to shop.',
    emptyAction: 'Add your first item',

    // modals
    addTitle: 'New Item',
    editTitle: 'Edit Item',
    fieldName: 'Item Name *',
    fieldNamePlaceholder: 'e.g. Banana, Milk, Bread',
    fieldQuantity: 'Quantity',
    fieldUnit: 'Unit',
    fieldCategory: 'Category',
    fieldPriority: 'Priority',
    fieldCost: 'Estimated Cost (Optional)',
    fieldBrand: 'Brand (Optional)',
    fieldBrandPlaceholder: 'e.g. Pınar, Sütaş',
    fieldNotes: 'Notes (Optional)',
    fieldNotesPlaceholder: 'A note you’d like to add…',

    // alerts
    errorTitle: 'Error',
    infoTitle: 'Info',
    doneTitle: 'Done',
    errorNameRequired: 'Please enter an item name',
    errorLoginToAdd: 'Sign in to add an item',
    errorLoginToUpdate: 'Sign in to make updates',
    errorAddFailed: 'Could not add the item to your list',
    errorUpdateFailed: 'Could not update the item',
    errorDeleteFailed: 'Could not delete the item',
    successUpdated: 'Item updated',
    deleteItemTitle: 'Delete Item',
    deleteItemMessage: 'Are you sure you want to delete this item?',
    pantryNoneLow: 'No low-stock items found in your pantry',
    pantryAdded: 'Added %{count} low-stock item(s)',
    pantryAddFailed: 'Could not add items from your pantry',
    clearNoneTitle: 'No completed items to clear',
    clearConfirmTitle: 'Clear Completed',
    clearConfirmMessage: 'Delete %{count} completed item(s)?',
    clearFailed: 'Could not clear completed items',
    pantryRunningLow: 'Running low (%{quantity} %{unit} left)',
  },
  tr: {
    eyebrow: 'Mutfak Defteri',
    title: 'Alışveriş Listesi',
    subtitle: '%{pending} bekliyor • %{completed} tamamlandı',
    loading: 'Alışveriş listen yükleniyor…',

    // compact stats
    statItems: 'Ürün',
    statCost: 'Tutar',
    statDone: 'Bitti',

    searchPlaceholder: 'Ara…',

    // quick actions / toggles
    quickActions: 'Hızlı İşlemler',
    tabPending: 'Bekleyen (%{count})',
    tabCompleted: 'Tamamlanan (%{count})',
    addFromPantry: 'Kilerden Ekle',
    clearCompleted: 'Tamamlananları Temizle (%{count})',

    // filter sections
    sectionCategories: 'Kategoriler',
    sectionPriority: 'Öncelik',

    // categories (display labels)
    catAll: 'Tümü',
    catFruits: 'Meyve',
    catVegetables: 'Sebze',
    catDairy: 'Süt Ürünleri',
    catMeat: 'Et',
    catGrains: 'Tahıl',
    catSnacks: 'Atıştırmalık',
    catBeverages: 'İçecek',
    catGeneral: 'Genel',

    // priorities (display labels)
    prioLow: 'Düşük',
    prioMedium: 'Orta',
    prioHigh: 'Yüksek',
    prioUrgent: 'Acil',

    // empty state
    emptyCompletedTitle: 'Tamamlanan yok',
    emptyTitle: 'Listen henüz boş',
    emptyCompletedSubtitle: 'Ürünleri işaretledikçe burada görünür.',
    emptySubtitle:
      'Mutfağına lazım olanları ekle, alışverişe hazır hâle getirelim.',
    emptyAction: 'İlk ürünü ekle',

    // modals
    addTitle: 'Yeni Ürün',
    editTitle: 'Ürünü Düzenle',
    fieldName: 'Ürün Adı *',
    fieldNamePlaceholder: 'örn. Muz, Süt, Ekmek',
    fieldQuantity: 'Miktar',
    fieldUnit: 'Birim',
    fieldCategory: 'Kategori',
    fieldPriority: 'Öncelik',
    fieldCost: 'Tahmini Tutar (Opsiyonel)',
    fieldBrand: 'Marka (Opsiyonel)',
    fieldBrandPlaceholder: 'örn. Pınar, Sütaş',
    fieldNotes: 'Notlar (Opsiyonel)',
    fieldNotesPlaceholder: 'Eklemek istediğin not…',

    // alerts
    errorTitle: 'Hata',
    infoTitle: 'Bilgi',
    doneTitle: 'Tamam',
    errorNameRequired: 'Lütfen bir ürün adı gir',
    errorLoginToAdd: 'Ürün eklemek için giriş yap',
    errorLoginToUpdate: 'Güncellemek için giriş yap',
    errorAddFailed: 'Ürün listeye eklenemedi',
    errorUpdateFailed: 'Ürün güncellenemedi',
    errorDeleteFailed: 'Ürün silinemedi',
    successUpdated: 'Ürün güncellendi',
    deleteItemTitle: 'Ürünü Sil',
    deleteItemMessage: 'Bu ürünü silmek istediğine emin misin?',
    pantryNoneLow: 'Kilerde azalan ürün bulunamadı',
    pantryAdded: '%{count} azalan ürün eklendi',
    pantryAddFailed: 'Kilerden ürün eklenemedi',
    clearNoneTitle: 'Temizlenecek tamamlanan ürün yok',
    clearConfirmTitle: 'Tamamlananları Temizle',
    clearConfirmMessage: '%{count} tamamlanan ürün silinsin mi?',
    clearFailed: 'Tamamlananlar temizlenemedi',
    pantryRunningLow: 'Azalıyor (%{quantity} %{unit} kaldı)',
  },
};
