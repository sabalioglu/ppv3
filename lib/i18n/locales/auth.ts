// auth strings. en = primary (displayed by default), tr = secondary.
export default {
  en: {
    // login
    loginEyebrow: 'STOVD KITCHEN',
    loginTitle: 'Welcome\nback',
    loginLede: 'Let’s remember what you can cook with what’s in your pantry.',
    forgotPassword: 'Forgot your password?',
    signIn: 'Sign in',
    noAccount: 'Don’t have an account? ',
    signUpLink: 'Sign up',
    emailNotConfirmedTitle: 'Email Not Confirmed',
    emailNotConfirmedMessage:
      'Please check your email and click the confirmation link before signing in.',
    resendEmail: 'Resend Email',
    emailSentTitle: 'Email Sent',
    emailSentMessage: 'Confirmation email has been resent.',

    // social
    continueWithGoogle: 'Continue with Google',

    // signup
    signupEyebrow: 'JOIN STOVD',
    signupTitle: 'Make your\nkitchen smart',
    signupLede:
      'Create your account and we’ll suggest meals from what you have.',
    signUp: 'Sign up',
    haveAccount: 'Already have an account? ',
    signInLink: 'Sign in',
    checkEmailTitle: 'Check Your Email! 📧',
    checkEmailMessage:
      'We sent you a confirmation link. Please check your email to activate your account.',

    // shared inputs
    emailPlaceholder: 'Email',
    passwordPlaceholder: 'Password',
    confirmPasswordPlaceholder: 'Confirm password',

    // reset password
    resetEyebrow: 'PASSWORD RESET',
    resetTitle: 'Forgot your\npassword?',
    resetLede: 'Enter your email and we’ll send you a reset link.',
    sendResetLink: 'Send reset link',
    rememberedPassword: 'Remembered your password? ',
    resetSentTitle: 'Check your email! 📧',
    resetSentMessage:
      'We have sent you a password reset link. Please check your email inbox.',
    resetFailed: 'Failed to send reset email',

    // reset confirm password
    newPasswordEyebrow: 'NEW PASSWORD',
    newPasswordTitle: 'Set your new\npassword',
    newPasswordLede:
      'Enter and confirm your new password to keep your account safe.',
    newPasswordPlaceholder: 'New password',
    confirmNewPasswordPlaceholder: 'Confirm new password',
    updatePassword: 'Update password',
    passwordUpdatedTitle: 'Password Updated ✅',
    passwordUpdatedMessage:
      'Your password has been reset successfully. You can now log in with your new password.',
    updatePasswordFailed: 'Failed to reset password',

    // email confirmed
    confirmedEyebrow: 'CONFIRMED',
    confirmedTitle: 'Your email is\nconfirmed',
    confirmedSubtitle:
      'Your account is ready. Let’s take a look at your kitchen.',
    goToApp: 'Go to app',
    goToLogin: 'Go to login',
    redirecting: 'Redirecting in 5 seconds…',

    // onboarding
    stepProgress: 'STEP %{current} / %{total}',
    almostReadyTitle: 'Almost ready!',
    almostReadyText:
      'With the details you give, we’ll automatically calculate your daily nutrition targets and keep you away from allergens.',
    completeProfile: 'Complete profile',
    profileSaveFailed: '❌ Profile save failed',
    profileSaveFailedFallback: 'Please try again.',
    step1Kicker: 'LET’S GET TO KNOW YOU',
    step1Title: 'Basic info',
    step2Kicker: 'YOUR BODY MEASUREMENTS',
    step2Title: 'Physical data',
    step3Kicker: 'YOUR MAIN GOAL',
    step3Title: 'Health goal',
    step4Kicker: 'FINE TUNING',
    step4Title: 'Micro goals',
    step5Kicker: 'FOR YOUR SAFETY',
    step5Title: 'Allergens',
    step6Kicker: 'YOUR TASTE',
    step6Title: 'Dietary preferences',
    step7Kicker: 'WHAT YOU LOVE',
    step7Title: 'Cuisine preferences',
    step8Kicker: 'LAST STEP',
    step8Title: 'Cooking skill',

    // onboarding — step bodies (fields, options, helpers, validation)
    onboarding: {
      // Welcome hook (pre-form)
      welcome: {
        brand: 'Stovd',
        titleLead: 'Cook what you\nalready ',
        titleAccent: 'have.',
        subtitle:
          'Tell us about your kitchen and tastes — we’ll turn what’s in your fridge into dinner.',
        getStarted: 'Get started',
        haveAccount: 'Already have an account? ',
        signIn: 'Sign in',
      },

      // Payoff / reveal (post-form)
      payoff: {
        eyebrow: 'Your kitchen is ready',
        title: 'Your recipes,\ntuned to you.',
        cardLabel: 'recipes tuned to your taste',
        cardLabelFlavors: 'recipes in your flavors',
        statCuisines: 'Cuisines',
        statSkill: 'Skill',
        statAllergens: 'Allergens handled',
        startCooking: 'Start cooking',
        skillBeginner: 'Beginner',
        skillIntermediate: 'Intermediate',
        skillAdvanced: 'Advanced',
        skillExpert: 'Expert',
        skillNotSet: 'Any',
      },

      // BasicInfo
      basicHelper: 'Just a few details so we can tailor your kitchen.',
      fullNameLabel: 'Full name',
      fullNamePlaceholder: 'Enter your full name',
      ageLabel: 'Age',
      agePlaceholder: 'Your age',
      ageUnit: 'yrs',
      genderLabel: 'Gender',
      genderMale: 'Male',
      genderFemale: 'Female',
      genderOther: 'Other',

      // PhysicalStats
      physicalHelper: 'We use these to estimate your daily nutrition targets.',
      heightLabel: 'Height',
      heightPlaceholder: 'Height',
      heightUnit: 'cm',
      weightLabel: 'Weight',
      weightPlaceholder: 'Weight',
      weightUnit: 'kg',
      activityLabel: 'Activity level',
      activitySedentary: 'Sedentary',
      activitySedentaryDesc: 'Little to no exercise',
      activityLightly: 'Lightly active',
      activityLightlyDesc: '1–3 days a week',
      activityModerately: 'Moderately active',
      activityModeratelyDesc: '3–5 days a week',
      activityVery: 'Very active',
      activityVeryDesc: '6–7 days a week',
      activityExtra: 'Extra active',
      activityExtraDesc: 'Intense daily training',

      // CookingSkill
      cookingHelper: 'How would you describe your time in the kitchen?',
      cookingLabel: 'Cooking skill',
      skillBeginner: 'Beginner',
      skillBeginnerDesc: 'Just starting to find my way around',
      skillIntermediate: 'Intermediate',
      skillIntermediateDesc: 'Comfortable with everyday recipes',
      skillAdvanced: 'Advanced',
      skillAdvancedDesc: 'I cook from scratch with ease',
      skillExpert: 'Expert',
      skillExpertDesc: 'Confident with anything in the kitchen',

      // SelectableList — shared
      clearSelection: 'None of these apply to me',

      // Health goals (macros)
      goalsMacrosHelper: 'Pick the one goal you’re focused on right now.',
      goalWeightLoss: 'Weight loss',
      goalMuscleGain: 'Muscle gain',
      goalMaintainWeight: 'Maintain weight',

      // Health goals (micros)
      goalsMicrosHelper: 'Add any wellness focuses you care about.',
      goalImproveHealth: 'Improve health',
      goalEnergyBoost: 'Energy boost',
      goalDigestiveHealth: 'Digestive health',
      goalSkinHealth: 'Skin health',
      goalHormonalBalance: 'Hormonal balance',
      goalHeartHealth: 'Heart health',
      goalImmuneSupport: 'Immune support',
      goalBoneStrength: 'Bone strength',
      goalAntiAging: 'Anti-aging',
      goalBloodSugar: 'Blood sugar',
      goalCholesterol: 'Cholesterol',

      // Allergens
      allergensHelper: 'Tell us what to keep off your plate.',
      allergenNuts: 'Tree nuts',
      allergenPeanuts: 'Peanuts',
      allergenDairy: 'Dairy',
      allergenEggs: 'Eggs',
      allergenSoy: 'Soy',
      allergenWheat: 'Gluten',
      allergenFish: 'Fish',
      allergenShellfish: 'Shellfish',
      allergenSesame: 'Sesame',
      allergenSulfites: 'Sulfites',

      // Dietary preferences
      dietaryHelper: 'Choose the eating styles that suit you.',
      dietVegan: 'Vegan',
      dietVegetarian: 'Vegetarian',
      dietPescatarian: 'Pescatarian',
      dietKeto: 'Ketogenic',
      dietPaleo: 'Paleo',
      dietMediterranean: 'Mediterranean',
      dietLowCarb: 'Low carb',
      dietGlutenFree: 'Gluten free',
      dietDairyFree: 'Dairy free',
      dietLowFat: 'Low fat',
      dietRawFood: 'Raw food',
      dietFlexitarian: 'Flexitarian',
      dietWhole30: 'Whole30',
      dietDash: 'DASH',
      dietFodmap: 'FODMAP',
      dietCarnivore: 'Carnivore',
      dietHalal: 'Halal',
      dietKosher: 'Kosher',
      dietIntermittentFasting: 'Intermittent fasting',
      dietDiabeticFriendly: 'Diabetic-friendly',

      // Cuisines
      cuisinesHelper: 'Pick the flavors you reach for most.',
      cuisineItalian: 'Italian',
      cuisineChinese: 'Chinese',
      cuisineJapanese: 'Japanese',
      cuisineTurkish: 'Turkish',
      cuisineMexican: 'Mexican',
      cuisineIndian: 'Indian',
      cuisineFrench: 'French',
      cuisineThai: 'Thai',
      cuisineGreek: 'Greek',
      cuisineKorean: 'Korean',
      cuisineSpanish: 'Spanish',
      cuisineVietnamese: 'Vietnamese',
      cuisineLebanese: 'Lebanese',
      cuisineGerman: 'German',
      cuisineBrazilian: 'Brazilian',
      cuisineMoroccan: 'Moroccan',
      cuisineEthiopian: 'Ethiopian',
      cuisineRussian: 'Russian',
      cuisineAmerican: 'American',
      cuisinePeruvian: 'Peruvian',
    },
  },
  tr: {
    // login
    loginEyebrow: 'STOVD MUTFAĞI',
    loginTitle: 'Tekrar hoş\ngeldin',
    loginLede: 'Dolabındakilerle ne pişireceğini hatırlayalım.',
    forgotPassword: 'Şifreni mi unuttun?',
    signIn: 'Giriş yap',
    noAccount: 'Hesabın yok mu? ',
    signUpLink: 'Kayıt ol',
    emailNotConfirmedTitle: 'E-posta Onaylanmadı',
    emailNotConfirmedMessage:
      'Giriş yapmadan önce lütfen e-postanı kontrol edip onay bağlantısına tıkla.',
    resendEmail: 'E-postayı Tekrar Gönder',
    emailSentTitle: 'E-posta Gönderildi',
    emailSentMessage: 'Onay e-postası tekrar gönderildi.',

    // social
    continueWithGoogle: 'Google ile devam et',

    // signup
    signupEyebrow: "STOVD'A KATIL",
    signupTitle: 'Mutfağını\nakıllandır',
    signupLede: 'Hesabını oluştur, elindekilerle yemek önerelim.',
    signUp: 'Kayıt ol',
    haveAccount: 'Zaten hesabın var mı? ',
    signInLink: 'Giriş yap',
    checkEmailTitle: 'E-postanı Kontrol Et! 📧',
    checkEmailMessage:
      'Sana bir onay bağlantısı gönderdik. Hesabını aktifleştirmek için lütfen e-postanı kontrol et.',

    // shared inputs
    emailPlaceholder: 'E-posta',
    passwordPlaceholder: 'Şifre',
    confirmPasswordPlaceholder: 'Şifre (tekrar)',

    // reset password
    resetEyebrow: 'ŞİFRE SIFIRLAMA',
    resetTitle: 'Şifreni mi\nunuttun?',
    resetLede: 'E-posta adresini gir, sana sıfırlama bağlantısı gönderelim.',
    sendResetLink: 'Sıfırlama bağlantısı gönder',
    rememberedPassword: 'Şifreni hatırladın mı? ',
    resetSentTitle: 'E-postanı kontrol et! 📧',
    resetSentMessage:
      'Sana bir şifre sıfırlama bağlantısı gönderdik. Lütfen e-posta gelen kutunu kontrol et.',
    resetFailed: 'Sıfırlama e-postası gönderilemedi',

    // reset confirm password
    newPasswordEyebrow: 'YENİ ŞİFRE',
    newPasswordTitle: 'Yeni şifreni\nbelirle',
    newPasswordLede: 'Yeni şifreni gir ve onayla, hesabını güvende tutalım.',
    newPasswordPlaceholder: 'Yeni şifre',
    confirmNewPasswordPlaceholder: 'Yeni şifre (tekrar)',
    updatePassword: 'Şifreyi güncelle',
    passwordUpdatedTitle: 'Şifre Güncellendi ✅',
    passwordUpdatedMessage:
      'Şifren başarıyla sıfırlandı. Artık yeni şifrenle giriş yapabilirsin.',
    updatePasswordFailed: 'Şifre sıfırlanamadı',

    // email confirmed
    confirmedEyebrow: 'DOĞRULANDI',
    confirmedTitle: 'E-postan\nonaylandı',
    confirmedSubtitle: 'Hesabın hazır. Hadi mutfağına göz atalım.',
    goToApp: 'Uygulamaya git',
    goToLogin: 'Girişe git',
    redirecting: '5 saniye içinde yönlendiriliyorsun…',

    // onboarding
    stepProgress: 'ADIM %{current} / %{total}',
    almostReadyTitle: 'Neredeyse hazır!',
    almostReadyText:
      'Verdiğin bilgilerle günlük besin hedeflerini otomatik hesaplayıp seni alerjenlerden uzak tutacağız.',
    completeProfile: 'Profili tamamla',
    profileSaveFailed: '❌ Profil kaydedilemedi',
    profileSaveFailedFallback: 'Lütfen tekrar dene.',
    step1Kicker: 'SENİ TANIYALIM',
    step1Title: 'Temel bilgiler',
    step2Kicker: 'VÜCUT ÖLÇÜLERİN',
    step2Title: 'Fiziksel veriler',
    step3Kicker: 'ANA HEDEFİN',
    step3Title: 'Sağlık hedefin',
    step4Kicker: 'İNCE AYAR',
    step4Title: 'Mikro hedefler',
    step5Kicker: 'GÜVENLİĞİN İÇİN',
    step5Title: 'Alerjenler',
    step6Kicker: 'DAMAK TADIN',
    step6Title: 'Beslenme tercihleri',
    step7Kicker: 'NELERİ SEVERSİN',
    step7Title: 'Mutfak tercihleri',
    step8Kicker: 'SON ADIM',
    step8Title: 'Mutfak becerin',

    // onboarding — step bodies (fields, options, helpers, validation)
    onboarding: {
      // Welcome hook (pre-form)
      welcome: {
        brand: 'Stovd',
        titleLead: 'Elindekilerle\n',
        titleAccent: 'pişir.',
        subtitle:
          'Bize mutfağını ve damak tadını anlat — dolabındakileri akşam yemeğine çevirelim.',
        getStarted: 'Başlayalım',
        haveAccount: 'Zaten hesabın var mı? ',
        signIn: 'Giriş yap',
      },

      // Payoff / reveal (post-form)
      payoff: {
        eyebrow: 'Mutfağın hazır',
        title: 'Tariflerin,\nsana göre ayarlı.',
        cardLabel: 'damak tadına göre seçilmiş tarif',
        cardLabelFlavors: 'senin lezzetlerinde tarif',
        statCuisines: 'Mutfak',
        statSkill: 'Beceri',
        statAllergens: 'Alerjen ele alındı',
        startCooking: 'Pişirmeye başla',
        skillBeginner: 'Başlangıç',
        skillIntermediate: 'Orta',
        skillAdvanced: 'İleri',
        skillExpert: 'Uzman',
        skillNotSet: 'Fark etmez',
      },

      // BasicInfo
      basicHelper: 'Mutfağını sana göre kuralım diye birkaç bilgi.',
      fullNameLabel: 'Ad soyad',
      fullNamePlaceholder: 'Ad soyadını gir',
      ageLabel: 'Yaş',
      agePlaceholder: 'Yaşın',
      ageUnit: 'yaş',
      genderLabel: 'Cinsiyet',
      genderMale: 'Erkek',
      genderFemale: 'Kadın',
      genderOther: 'Diğer',

      // PhysicalStats
      physicalHelper: 'Günlük besin hedeflerini hesaplamak için kullanırız.',
      heightLabel: 'Boy',
      heightPlaceholder: 'Boy',
      heightUnit: 'cm',
      weightLabel: 'Kilo',
      weightPlaceholder: 'Kilo',
      weightUnit: 'kg',
      activityLabel: 'Aktivite seviyesi',
      activitySedentary: 'Hareketsiz',
      activitySedentaryDesc: 'Az ya da hiç egzersiz',
      activityLightly: 'Az hareketli',
      activityLightlyDesc: 'Haftada 1–3 gün',
      activityModerately: 'Orta hareketli',
      activityModeratelyDesc: 'Haftada 3–5 gün',
      activityVery: 'Çok hareketli',
      activityVeryDesc: 'Haftada 6–7 gün',
      activityExtra: 'Aşırı hareketli',
      activityExtraDesc: 'Her gün yoğun antrenman',

      // CookingSkill
      cookingHelper: 'Mutfaktaki tecrübeni nasıl tanımlarsın?',
      cookingLabel: 'Mutfak becerin',
      skillBeginner: 'Başlangıç',
      skillBeginnerDesc: 'Mutfakta daha yeni yolumu buluyorum',
      skillIntermediate: 'Orta',
      skillIntermediateDesc: 'Günlük tariflerde rahatım',
      skillAdvanced: 'İleri',
      skillAdvancedDesc: 'Sıfırdan rahatça pişiririm',
      skillExpert: 'Uzman',
      skillExpertDesc: 'Mutfakta her şeye varım',

      // SelectableList — shared
      clearSelection: 'Bunların hiçbiri bana uymuyor',

      // Health goals (macros)
      goalsMacrosHelper: 'Şu an odaklandığın tek hedefi seç.',
      goalWeightLoss: 'Kilo verme',
      goalMuscleGain: 'Kas kazanımı',
      goalMaintainWeight: 'Kiloyu koruma',

      // Health goals (micros)
      goalsMicrosHelper: 'Önemsediğin sağlık odaklarını ekle.',
      goalImproveHealth: 'Sağlığı iyileştir',
      goalEnergyBoost: 'Enerji artışı',
      goalDigestiveHealth: 'Sindirim sağlığı',
      goalSkinHealth: 'Cilt sağlığı',
      goalHormonalBalance: 'Hormon dengesi',
      goalHeartHealth: 'Kalp sağlığı',
      goalImmuneSupport: 'Bağışıklık desteği',
      goalBoneStrength: 'Kemik gücü',
      goalAntiAging: 'Yaşlanma karşıtı',
      goalBloodSugar: 'Kan şekeri',
      goalCholesterol: 'Kolesterol',

      // Allergens
      allergensHelper: 'Tabağından uzak tutmamız gerekenleri söyle.',
      allergenNuts: 'Kuruyemiş',
      allergenPeanuts: 'Yer fıstığı',
      allergenDairy: 'Süt ürünleri',
      allergenEggs: 'Yumurta',
      allergenSoy: 'Soya',
      allergenWheat: 'Gluten',
      allergenFish: 'Balık',
      allergenShellfish: 'Kabuklu deniz ürünleri',
      allergenSesame: 'Susam',
      allergenSulfites: 'Sülfitler',

      // Dietary preferences
      dietaryHelper: 'Sana uyan beslenme tarzlarını seç.',
      dietVegan: 'Vegan',
      dietVegetarian: 'Vejetaryen',
      dietPescatarian: 'Pesketaryen',
      dietKeto: 'Ketojenik',
      dietPaleo: 'Paleo',
      dietMediterranean: 'Akdeniz',
      dietLowCarb: 'Düşük karbonhidrat',
      dietGlutenFree: 'Glutensiz',
      dietDairyFree: 'Sütsüz',
      dietLowFat: 'Az yağlı',
      dietRawFood: 'Çiğ beslenme',
      dietFlexitarian: 'Esnek vejetaryen',
      dietWhole30: 'Whole30',
      dietDash: 'DASH',
      dietFodmap: 'FODMAP',
      dietCarnivore: 'Karnivor',
      dietHalal: 'Helal',
      dietKosher: 'Koşer',
      dietIntermittentFasting: 'Aralıklı oruç',
      dietDiabeticFriendly: 'Diyabet dostu',

      // Cuisines
      cuisinesHelper: 'En çok tercih ettiğin lezzetleri seç.',
      cuisineItalian: 'İtalyan',
      cuisineChinese: 'Çin',
      cuisineJapanese: 'Japon',
      cuisineTurkish: 'Türk',
      cuisineMexican: 'Meksika',
      cuisineIndian: 'Hint',
      cuisineFrench: 'Fransız',
      cuisineThai: 'Tayland',
      cuisineGreek: 'Yunan',
      cuisineKorean: 'Kore',
      cuisineSpanish: 'İspanyol',
      cuisineVietnamese: 'Vietnam',
      cuisineLebanese: 'Lübnan',
      cuisineGerman: 'Alman',
      cuisineBrazilian: 'Brezilya',
      cuisineMoroccan: 'Fas',
      cuisineEthiopian: 'Etiyopya',
      cuisineRussian: 'Rus',
      cuisineAmerican: 'Amerikan',
      cuisinePeruvian: 'Peru',
    },
  },
};
