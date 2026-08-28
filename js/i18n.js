// goblub 다국어(i18n) — 8개 언어. 키 = 한국어 원문.
// common.js가 자기 다음에 로드(문서 어디서나 GoblubI18n 사용 가능).
// 사용: GoblubI18n.t("문장") / 페이지 텍스트는 DOMContentLoaded 후 텍스트 노드 치환으로 자동 번역.
(function () {
  var LANGS = [
    { c: "ko", n: "한국어" },
    { c: "en", n: "English" },
    { c: "es", n: "Español" },
    { c: "id", n: "Bahasa Indonesia" },
    { c: "ja", n: "日本語" },
    { c: "th", n: "ไทย" },
    { c: "zh", n: "简体中文" },
    { c: "tw", n: "繁體中文" }
  ];
  var lang = "ko";
  try { var v = localStorage.getItem("goblub_lang"); if (v && LANGS.some(function (l) { return l.c === v; })) lang = v; } catch (e) {}

  // ===== 사전: 키 = 한국어 원문 =====
  var D = {};
  function S(ko, en, es, id, ja, th, zh, tw) { D[ko] = { en: en, es: es, id: id, ja: ja, th: th, zh: zh, tw: tw }; }

  // --- 공통 크롬 ---
  S("홈", "Home", "Inicio", "Beranda", "ホーム", "หน้าแรก", "首页", "首頁");
  S("앱", "Apps", "Apps", "Aplikasi", "アプリ", "แอป", "应用", "應用");
  S("로그인", "Log in", "Iniciar sesión", "Masuk", "ログイン", "เข้าสู่ระบบ", "登录", "登入");
  S("마이페이지", "My Page", "Mi página", "Halaman Saya", "マイページ", "หน้าของฉัน", "我的主页", "我的主頁");
  S("홈으로", "Go Home", "Ir al inicio", "Ke Beranda", "ホームへ", "กลับหน้าแรก", "回首页", "回首頁");
  S("앱 다운로드", "Download Apps", "Descargar apps", "Unduh Aplikasi", "アプリDL", "ดาวน์โหลดแอป", "下载应用", "下載應用");
  S("📱 앱은 아직 준비 중이에요!", "📱 Apps are coming soon!", "📱 ¡Las apps llegarán pronto!", "📱 Aplikasi segera hadir!", "📱 アプリはただいま準備中！", "📱 แอปกำลังจะมาเร็ว ๆ นี้!", "📱 应用即将上线！", "📱 應用即將上線！");
  S("로그아웃", "Log out", "Cerrar sesión", "Keluar", "ログアウト", "ออกจากระบบ", "退出登录", "登出");
  S("🔑 로그인", "🔑 Log in", "🔑 Iniciar sesión", "🔑 Masuk", "🔑 ログイン", "🔑 เข้าสู่ระบบ", "🔑 登录", "🔑 登入");

  // --- 홈 ---
  S("고브럽", "Goblub", "Goblub", "Goblub", "ゴブラブ", "Goblub", "Goblub", "Goblub");
  S("행운은 눌러야 나와", "Luck pops out when you tap", "La suerte sale cuando tocas", "Keberuntungan keluar saat kamu ketuk", "幸運はタップすると出てくる", "โชคดีจะออกมาเมื่อคุณแตะ", "好运是点出来的", "好運是點出來的");
  S("나를 눌러봐~", "Tap me~", "¡Tócame~!", "Ketuk aku~", "ボクを押してみて〜", "แตะฉันสิ~", "点点我~", "點點我~");
  S("심심하지? 콕 눌러봐!", "Bored? Give me a poke!", "¿Aburrido? ¡Dame un toque!", "Bosan? Colek aku!", "ヒマでしょ？つついてみて！", "เบื่อเหรอ? จิ้มฉันสิ!", "无聊吧？戳我一下！", "無聊吧？戳我一下！");
  S("여기야 여기~ 클릭!", "Over here~ click!", "¡Aquí, aquí~ clic!", "Di sini~ klik!", "ここだよ〜クリック！", "ทางนี้~ คลิก!", "在这里~点我！", "在這裡~點我！");
  S("놀 거 잔뜩 물고 있어!", "I'm holding tons of fun!", "¡Tengo un montón de juegos!", "Aku bawa banyak keseruan!", "遊びをいっぱいくわえてるよ！", "ฉันคาบของเล่นมาเพียบ!", "我嘴里叼满了好玩的！", "我嘴裡叼滿了好玩的！");
  S("누르면 좋은 일 생김", "Tap for good luck", "Toca y pasan cosas buenas", "Ketuk untuk hal baik", "押すといいこと起きるよ", "แตะแล้วมีเรื่องดี ๆ", "点一下有好事发生", "點一下有好事發生");
  S("입 벌리면 놀라지 마!", "Don't be shocked when I open wide!", "¡No te asustes cuando abra la boca!", "Jangan kaget saat mulutku terbuka!", "口を開けてもびっくりしないでね！", "อ้าปากแล้วอย่าตกใจนะ!", "我张嘴时别被吓到！", "我張嘴時別被嚇到！");
  S("…하암. 너 진짜 일찍 일어났다 🌅", "…Yawn. You're up really early 🌅", "…Uaah. Madrugaste de verdad 🌅", "…Huaam. Kamu bangun pagi banget 🌅", "…ふぁあ。ほんとに早起きだね 🌅", "…หาว เธอตื่นเช้าจริง ๆ 🌅", "…哈欠。你起得真早 🌅", "…哈欠。你起得真早 🌅");
  S("아침 공기 냠… 오늘 기운 좋은데?", "Nom, morning air… today feels lucky!", "Ñam, aire matutino… ¡hoy pinta bien!", "Nyam, udara pagi… hari ini hoki nih!", "朝の空気をパクリ…今日はツイてる予感！", "งั่ม อากาศยามเช้า… วันนี้ดวงดีนะ!", "吧唧，早晨的空气…今天运气不错哦！", "吧唧，早晨的空氣…今天運氣不錯喔！");
  S("좋은 아침! 오늘 운세 보고 가 ☀️", "Morning! Check today's fortune ☀️", "¡Buen día! Mira tu fortuna de hoy ☀️", "Pagi! Cek peruntunganmu hari ini ☀️", "おはよう！今日の運勢見ていって ☀️", "อรุณสวัสดิ์! ดูดวงวันนี้ก่อนสิ ☀️", "早上好！看看今日运势吧 ☀️", "早安！看看今日運勢吧 ☀️");
  S("아침밥 먹었어? 난 나쁜 감정 먹었어", "Had breakfast? I ate bad vibes", "¿Desayunaste? Yo comí malas vibras", "Sudah sarapan? Aku makan emosi buruk", "朝ごはん食べた？ボクは悪い気分を食べたよ", "กินข้าวเช้าหรือยัง? ฉันกินอารมณ์แย่ ๆ ไปแล้ว", "吃早饭了吗？我吃掉了坏情绪", "吃早餐了嗎？我吃掉了壞情緒");
  S("점심 뭐 먹지… 넌 정했어? 🍜", "What's for lunch… you decided? 🍜", "¿Qué almuerzo… ya elegiste? 🍜", "Makan siang apa ya… kamu sudah pilih? 🍜", "お昼何食べよう…もう決めた？🍜", "เที่ยงนี้กินอะไรดี… เธอเลือกหรือยัง? 🍜", "午饭吃什么…你定了吗？🍜", "午餐吃什麼…你定了嗎？🍜");
  S("밥 먹고 포춘쿠키 하나 어때", "How about a fortune cookie after lunch?", "¿Una galleta de la fortuna tras comer?", "Habis makan, coba kue keberuntungan?", "食後にフォーチュンクッキーはどう？", "กินข้าวแล้วลองคุกกี้เสี่ยงทายไหม", "饭后来个幸运饼干怎么样", "飯後來個幸運餅乾怎麼樣");
  S("나른한 시간… 미니게임 한 판? 🎲", "Sleepy hours… quick mini game? 🎲", "Hora de flojera… ¿un minijuego? 🎲", "Jam ngantuk… main mini game? 🎲", "まったりタイム…ミニゲームどう？🎲", "ช่วงเวลาง่วง ๆ… เล่นมินิเกมไหม? 🎲", "犯困时间…来局小游戏？🎲", "犯睏時間…來局小遊戲？🎲");
  S("오후엔 집중력 도둑이 다닌대. 조심해", "They say focus-thieves roam afternoons. Careful!", "Dicen que hay ladrones de concentración por la tarde. ¡Ojo!", "Katanya pencuri fokus berkeliaran sore hari. Hati-hati!", "午後は集中力泥棒が出るんだって。気をつけて", "ว่ากันว่าตอนบ่ายมีโจรขโมยสมาธิ ระวังนะ", "听说下午有专注力小偷出没，小心哦", "聽說下午有專注力小偷出沒，小心喔");
  S("오늘 하루 어땠어? 🌆", "How was your day? 🌆", "¿Qué tal tu día? 🌆", "Gimana harimu? 🌆", "今日はどんな一日だった？🌆", "วันนี้เป็นยังไงบ้าง? 🌆", "今天过得怎么样？🌆", "今天過得怎麼樣？🌆");
  S("저녁엔 별자리 궁합이 잘 맞는대", "Evenings are best for star matches", "Dicen que de noche las estrellas acompañan", "Malam hari cocok buat cek kecocokan bintang", "夜は星座の相性がよく当たるんだって", "ตอนค่ำดูดวงสมพงษ์ดาวแม่นสุด", "傍晚最适合看星座配对", "傍晚最適合看星座配對");
  S("라면… 끓일까 말까… 🍜", "Ramen… should I or not… 🍜", "Ramen… ¿lo hago o no…? 🍜", "Mi instan… masak nggak ya… 🍜", "ラーメン…作ろうかどうしようか…🍜", "มาม่า… ต้มดีไหมนะ… 🍜", "泡面…煮还是不煮…🍜", "泡麵…煮還是不煮…🍜");
  S("자기 전에 타로 한 장 어때 🌙", "A tarot card before bed? 🌙", "¿Una carta de tarot antes de dormir? 🌙", "Tarot selembar sebelum tidur? 🌙", "寝る前にタロット一枚どう？🌙", "ก่อนนอนเปิดไพ่ทาโรต์สักใบไหม 🌙", "睡前抽张塔罗牌怎么样 🌙", "睡前抽張塔羅牌怎麼樣 🌙");
  S("…너 왜 안 자냐 👀", "…Why are you still awake 👀", "…¿Por qué no duermes? 👀", "…Kok belum tidur 👀", "…なんでまだ起きてるの 👀", "…ทำไมยังไม่นอน 👀", "…你怎么还不睡 👀", "…你怎麼還不睡 👀");
  S("이 시간엔 별이 제일 잘 보여 ✨", "Stars shine brightest at this hour ✨", "A esta hora las estrellas se ven mejor ✨", "Jam segini bintang paling terlihat ✨", "この時間は星が一番よく見えるよ ✨", "ช่วงนี้ดาวชัดที่สุดเลย ✨", "这个时间星星最亮 ✨", "這個時間星星最亮 ✨");
  S("새벽 3시… 무슨 고민 있어?", "3 AM… something on your mind?", "3 AM… ¿algo te preocupa?", "Jam 3 pagi… ada yang mengganjal?", "深夜3時…何か悩みでもあるの？", "ตี 3 แล้ว… มีอะไรกลุ้มใจเหรอ?", "凌晨3点…有什么心事吗？", "凌晨3點…有什麼心事嗎？");
  S("쉿. 지금은 귀곡 선생 순찰 시간이야 🕯", "Shh. It's Master Gwigok's patrol hour 🕯", "Shh. Es la ronda del Maestro Gwigok 🕯", "Ssst. Ini jam patroli Guru Gwigok 🕯", "シッ。今は鬼哭先生の見回り時間だよ 🕯", "จุ๊ ๆ ตอนนี้เป็นเวลาตรวจตราของอาจารย์กวีก๊ก 🕯", "嘘，现在是鬼哭先生巡逻的时间 🕯", "噓，現在是鬼哭先生巡邏的時間 🕯");
  S("운세", "Fortune", "Fortuna", "Ramalan", "運勢", "ดูดวง", "运势", "運勢");
  S("사주 · 궁합 · 타로 · 쿠키", "Saju · Match · Tarot · Cookie", "Saju · Compatibilidad · Tarot · Galleta", "Saju · Kecocokan · Tarot · Kue", "四柱 · 相性 · タロット · クッキー", "ดวงชะตา · ความเข้ากัน · ทาโรต์ · คุกกี้", "四柱 · 合婚 · 塔罗 · 饼干", "四柱 · 合婚 · 塔羅 · 餅乾");
  S("대환장 테스트", "Chaos Tests", "Tests del caos", "Tes Kacau Seru", "大混乱テスト", "แบบทดสอบสุดป่วน", "大混乱测试", "大混亂測試");
  S("내 유형 다 털리는 심리테스트", "Quizzes that expose your true type", "Tests que revelan tu verdadero tipo", "Kuis yang bongkar tipe aslimu", "本性まるわかりの心理テスト", "ควิซที่เปิดโปงตัวตนของคุณ", "把你的类型扒个精光的心理测试", "把你的類型扒個精光的心理測試");
  S("미니 놀이터", "Mini Playground", "Mini parque", "Taman Mini", "ミニ広場", "สนามเด็กเล่นมินิ", "迷你乐园", "迷你樂園");
  S("룰렛 · 질문카드 · 작명 · 마음배달", "Roulette · Cards · Naming · Letters", "Ruleta · Cartas · Nombres · Mensajes", "Rolet · Kartu · Nama · Pesan", "ルーレット · 質問カード · 名付け · 気持ち配達", "รูเล็ต · การ์ดคำถาม · ตั้งชื่อ · ส่งใจ", "轮盘 · 问题卡 · 起名 · 心意快递", "輪盤 · 問題卡 · 起名 · 心意快遞");
  S("미니 놀이터 2", "Mini Playground 2", "Mini parque 2", "Taman Mini 2", "ミニ広場 2", "สนามเด็กเล่นมินิ 2", "迷你乐园 2", "迷你樂園 2");
  S("팡팡 · 반응속도 · 로또 · 밸런스", "Whack · Reflex · Lotto · Balance", "Golpea · Reflejos · Lotería · Balance", "Pukul · Refleks · Lotre · Pilihan", "モグラ · 反射神経 · ロト · 二択", "ทุบ · รีเฟล็กซ์ · ล็อตโต้ · เกมเลือก", "打地鼠 · 反应 · 乐透 · 平衡", "打地鼠 · 反應 · 樂透 · 平衡");
  S("직접 만든 앱들을 모아둔 곳", "Apps we built ourselves", "Apps hechas por nosotros", "Kumpulan aplikasi buatan kami", "自作アプリを集めた場所", "รวมแอปที่เราสร้างเอง", "我们自己开发的应用", "我們自己開發的應用");

  // --- 운세 허브 ---
  S("귀곡의 사주팔자", "Gwigok's Saju Reading", "El Saju de Gwigok", "Saju Gwigok", "鬼哭の四柱推命", "ดวงชะตาของกวีก๊ก", "鬼哭的四柱八字", "鬼哭的四柱八字");
  S("저승사자가 팔자를 뼛속까지 읽어주는 프리미엄 사주", "A grim reaper reads your fate to the bone — premium saju", "Un segador lee tu destino hasta los huesos — saju premium", "Malaikat maut membaca takdirmu sampai ke tulang — saju premium", "死神があなたの運命を骨まで読むプレミアム四柱", "ยมทูตอ่านชะตาคุณถึงกระดูก — ดูดวงพรีเมียม", "阴间使者为你深读命格的高级四柱", "陰間使者為你深讀命格的高級四柱");
  S("오늘의 사주", "Today's Saju", "Saju de hoy", "Saju Hari Ini", "今日の四柱", "ดวงวันนี้", "今日四柱", "今日四柱");
  S("내 사주로 보는 오늘의 총운·연애·재물·시험운", "Today's luck, love, money & exams from your saju", "Tu suerte de hoy: amor, dinero y exámenes", "Keberuntungan hari ini: cinta, uang & ujian", "四柱で見る今日の総合運・恋愛・金運・試験運", "ดวงรวม ความรัก การเงิน การสอบ จากดวงชะตาคุณ", "从你的四柱看今日总运·爱情·财运·考试运", "從你的四柱看今日總運·愛情·財運·考試運");
  S("부엉이 별자리 궁합", "Owl's Star Match", "Compatibilidad estelar del búho", "Kecocokan Bintang Burung Hantu", "フクロウの星座相性", "ความเข้ากันแห่งดวงดาวโดยนกฮูก", "猫头鹰星座配对", "貓頭鷹星座配對");
  S("두 사람의 별을 이어 — 점수 대신 별자리 한 장", "Connecting two people's stars — a constellation, not a score", "Une las estrellas de dos — una constelación, no un puntaje", "Menghubungkan bintang kalian — rasi, bukan skor", "ふたりの星をつないで — 点数の代わりに星座を一枚", "เชื่อมดาวของสองคน — ได้กลุ่มดาวแทนคะแนน", "连起两人的星星 — 不打分，画一张星座图", "連起兩人的星星 — 不打分，畫一張星座圖");
  S("고양이 타로", "Cat Tarot", "Tarot del gato", "Tarot Kucing", "ネコタロット", "ทาโรต์แมว", "猫咪塔罗", "貓咪塔羅");
  S("고양이 점술사가 앞발로 카드를 쫙 — 끌리는 한 장을 골라옹", "A cat fortune-teller fans the cards — pick the one that calls you, meow", "Un gato adivino abre las cartas — elige la que te llame, miau", "Kucing peramal membuka kartu — pilih yang memanggilmu, meong", "ネコ占い師が前足でカードをシャッ — 気になる一枚を選ぶニャ", "แมวหมอดูคลี่ไพ่ — เลือกใบที่ใจเรียกเมี๊ยว", "猫咪占卜师展开纸牌 — 选一张最吸引你的喵", "貓咪占卜師展開紙牌 — 選一張最吸引你的喵");
  S("해달의 포춘쿠키", "Otter's Fortune Cookie", "Galleta de la nutria", "Kue Keberuntungan Berang-berang", "ラッコのフォーチュンクッキー", "คุกกี้เสี่ยงทายนาก", "海獭幸运饼干", "海獺幸運餅乾");
  S("부둣가 해달이 조개로 콩콩 — 하루 한 번, 오늘의 한 줄", "A dockside otter cracks it open — one line a day", "Una nutria del muelle la abre — una frase al día", "Berang-berang dermaga membukanya — satu kalimat sehari", "波止場のラッコが貝でコンコン — 一日一回、今日のひとこと", "นากท่าเรือเคาะเปิด — วันละหนึ่งประโยค", "码头海獭敲开饼干 — 每天一句", "碼頭海獺敲開餅乾 — 每天一句");
  S("귀곡의 오늘 한 마디", "Gwigok's Word of the Day", "La frase del día de Gwigok", "Sepatah Kata Gwigok Hari Ini", "鬼哭の今日のひとこと", "หนึ่งประโยควันนี้จากกวีก๊ก", "鬼哭今日一言", "鬼哭今日一言");
  S("— 귀곡 선생", "— Master Gwigok", "— Maestro Gwigok", "— Guru Gwigok", "— 鬼哭先生", "— อาจารย์กวีก๊ก", "— 鬼哭先生", "— 鬼哭先生");

  // --- 테스트 허브 ---
  S("대환장 상황극 MBTI", "Chaos Roleplay MBTI", "MBTI de situaciones caóticas", "MBTI Drama Kacau", "大混乱シチュエーションMBTI", "MBTI สถานการณ์สุดป่วน", "大混乱情景剧MBTI", "大混亂情境劇MBTI");
  S("미니 식빵이 된 당신… 12가지 대환장 상황으로 보는 찐 본능", "You became a mini bread loaf… 12 chaotic scenes reveal your instincts", "Eres un mini pan… 12 escenas caóticas revelan tu instinto", "Kamu jadi roti mini… 12 situasi kacau mengungkap instingmu", "ミニ食パンになったあなた…12の大混乱シーンで見る本能", "คุณกลายเป็นขนมปังจิ๋ว… 12 สถานการณ์ป่วนเผยสัญชาตญาณจริง", "变成迷你面包的你…12个混乱场景看出真本能", "變成迷你麵包的你…12個混亂場景看出真本能");
  S("연애세포 테스트", "Love Cell Test", "Test de células del amor", "Tes Sel Cinta", "恋愛細胞テスト", "เทสต์เซลล์ความรัก", "恋爱细胞测试", "戀愛細胞測試");
  S("밀당·직진·집착·모솔·츤데레·헌신 — 나는 어떤 연애세포?", "Push-pull, direct, clingy, single-forever… which love cell are you?", "Tira y afloja, directo, obsesivo… ¿qué célula del amor eres?", "Tarik-ulur, gaspol, posesif… sel cintamu yang mana?", "駆け引き・一直線・執着・恋愛経験ゼロ…あなたの恋愛細胞は？", "แกล้งเล่นตัว จริงจัง ขี้หึง โสดตลอด… เซลล์รักของคุณคือแบบไหน?", "推拉·直球·执着·母胎单身…你是哪种恋爱细胞？", "推拉·直球·執著·母胎單身…你是哪種戀愛細胞？");
  S("스트레스 몬스터 변신", "Stress Monster Transformation", "Transformación del monstruo del estrés", "Transformasi Monster Stres", "ストレスモンスター変身", "แปลงร่างมอนสเตอร์ความเครียด", "压力怪兽变身", "壓力怪獸變身");
  S("스트레스 받으면 튀어나오는 내 몬스터 — 고브럽이 냠 먹어드림", "The monster that pops out when you're stressed — Goblub eats it up", "El monstruo que sale con tu estrés — Goblub se lo come", "Monster yang muncul saat kamu stres — Goblub melahapnya", "ストレスで飛び出すあなたのモンスター — ゴブラブがパクリ", "มอนสเตอร์ที่โผล่มาตอนเครียด — Goblub จัดการเอง", "压力一来就蹦出的怪兽 — Goblub帮你吃掉", "壓力一來就蹦出的怪獸 — Goblub幫你吃掉");
  S("좀비 아포칼립스 생존 유형", "Zombie Apocalypse Survival Type", "Tipo de supervivencia zombi", "Tipe Bertahan Kiamat Zombi", "ゾンビアポカリプス生存タイプ", "ประเภทเอาตัวรอดซอมบี้", "丧尸末日生存类型", "喪屍末日生存類型");
  S("좀비 사태 터졌다! 넌 며칠 버틸까 — 리더·전투·배신·첫날 사망…", "Zombie outbreak! How long will you last — leader, fighter, traitor…", "¡Brote zombi! ¿Cuánto durarás? — líder, guerrero, traidor…", "Wabah zombi! Kamu bertahan berapa hari — pemimpin, petarung, pengkhianat…", "ゾンビ発生！あなたは何日もつ？ — リーダー・戦闘・裏切り…", "ซอมบี้บุก! คุณจะรอดกี่วัน — ผู้นำ นักสู้ คนทรยศ…", "丧尸爆发！你能撑几天 — 领袖·战斗·背叛·首日阵亡…", "喪屍爆發！你能撐幾天 — 領袖·戰鬥·背叛·首日陣亡…");
  S("단톡방 캐릭터 테스트", "Group Chat Character Test", "Test de personaje del chat grupal", "Tes Karakter Grup Chat", "グルチャキャラテスト", "เทสต์คาแรกเตอร์แชทกลุ่ม", "群聊角色测试", "群聊角色測試");
  S("단톡방에서 나는? 도배왕·잠수함·드립러·눈팅 유령·공지봇…", "Who are you in group chats? Spammer, lurker, joker, ghost…", "¿Quién eres en el grupo? Spammer, fantasma, bromista…", "Kamu siapa di grup chat? Raja spam, silent reader, tukang bercanda…", "グルチャでのあなたは？連投王・潜水艦・ネタ職人・幽霊…", "ในแชทกลุ่มคุณคือใคร? เจ้าพ่อสแปม นักดำน้ำ สายมุก ผีเงียบ…", "群聊里的你是谁？刷屏王·潜水员·段子手·潜水幽灵…", "群聊裡的你是誰？洗版王·潛水員·段子手·潛水幽靈…");
  S("나는 무슨 음식형 인간?", "What Food Type Are You?", "¿Qué tipo de comida eres?", "Kamu Tipe Makanan Apa?", "あなたは何グルメタイプ？", "คุณเป็นมนุษย์สายอาหารแบบไหน?", "你是什么食物型人类？", "你是什麼食物型人類？");
  S("성격을 음식으로 — 마라탕형·물냉면형·국밥형·민초형·떡볶이형…", "Your personality as food — malatang, naengmyeon, tteokbokki…", "Tu personalidad en comida — malatang, fideos fríos, tteokbokki…", "Kepribadianmu sebagai makanan — malatang, mi dingin, tteokbokki…", "性格を食べ物で — マーラータン型・冷麺型・トッポギ型…", "บุคลิกคุณในรูปอาหาร — หม่าล่าทัง บะหมี่เย็น ต๊อกโบกี…", "用食物看性格 — 麻辣烫型·冷面型·炒年糕型…", "用食物看性格 — 麻辣燙型·冷麵型·炒年糕型…");
  S("나도 몰랐던 나를 꺼내는 테스트 모음 — 골라서 즐기세요", "Tests that reveal the you even you didn't know — pick and play", "Tests que sacan tu yo oculto — elige y juega", "Kumpulan tes yang mengungkap dirimu — pilih dan mainkan", "自分も知らなかった自分を引き出すテスト集", "รวมเทสต์ที่เผยตัวตนที่คุณก็ไม่รู้ — เลือกเล่นได้เลย", "挖出连你都不认识的自己 — 挑一个玩玩", "挖出連你都不認識的自己 — 挑一個玩玩");
  S("내 사주 프로필 하나로 전부 — 골라서 즐기세요", "One saju profile unlocks it all — pick and enjoy", "Un perfil de saju lo abre todo — elige y disfruta", "Satu profil saju untuk semua — pilih dan nikmati", "四柱プロフィールひとつで全部 — 選んで楽しんで", "โปรไฟล์ดวงเดียวใช้ได้ทุกอย่าง — เลือกสนุกได้เลย", "一份四柱档案通吃全部 — 挑着玩吧", "一份四柱檔案通吃全部 — 挑著玩吧");
  S("심심할 때, 모였을 때 툭 꺼내 쓰는 소소한 놀이 모음", "Little games for boredom or hangouts", "Juegos para el aburrimiento o reuniones", "Permainan kecil saat bosan atau kumpul", "ヒマな時、集まった時にサッと出せる小さな遊び", "เกมเล็ก ๆ ยามเบื่อหรือตอนรวมตัวกัน", "无聊或聚会时随手掏出的小游戏", "無聊或聚會時隨手掏出的小遊戲");
  S("손맛으로 노는 미니 게임 모음", "Mini games all about hand skills", "Minijuegos de pura habilidad", "Mini game andalan tangan", "手先で遊ぶミニゲーム集", "รวมมินิเกมวัดสกิลมือ", "拼手感的迷你游戏合集", "拼手感的迷你遊戲合集");
  S("직접 만든 앱들이에요. 다운로드 버튼은 곧 열립니다!", "Apps we made ourselves. Download buttons open soon!", "Apps hechas por nosotros. ¡Descarga pronto!", "Aplikasi buatan kami. Tombol unduh segera dibuka!", "自作アプリです。ダウンロードはもうすぐ！", "แอปที่เราสร้างเอง ปุ่มดาวน์โหลดจะเปิดเร็ว ๆ นี้!", "我们自己做的应用，下载按钮即将开放！", "我們自己做的應用，下載按鈕即將開放！");

  // --- 미니 허브 ---
  S("폭탄 돌리기", "Pass the Bomb", "Pasa la bomba", "Oper Bom", "爆弾まわし", "ส่งระเบิด", "传炸弹", "傳炸彈");
  S("언제 터질지 모른다 — 넘기고 넘기는 복불복", "No one knows when it blows — pass it on and pray", "Nadie sabe cuándo explota — pásala y reza", "Tak ada yang tahu kapan meledak — oper dan berdoa", "いつ爆発するかわからない — 回して回して運まかせ", "ไม่รู้จะระเบิดเมื่อไหร่ — ส่งต่อแล้ววัดดวง", "不知何时爆炸 — 传来传去拼运气", "不知何時爆炸 — 傳來傳去拼運氣");
  S("고브럽 생존 레이스", "Goblub Survival Race", "Carrera de supervivencia Goblub", "Balapan Bertahan Goblub", "ゴブラブサバイバルレース", "เรซเอาตัวรอด Goblub", "Goblub生存赛跑", "Goblub生存賽跑");
  S("운석 쏟아지는 트랙 — 꼴찌가 벌칙 당첨", "Meteors rain on the track — last place gets the penalty", "Llueven meteoritos — el último paga castigo", "Meteor berjatuhan — juru kunci kena hukuman", "隕石が降るトラック — ビリは罰ゲーム", "อุกกาบาตถล่มแทร็ก — ที่โหล่รับบทลงโทษ", "陨石砸满赛道 — 最后一名领惩罚", "隕石砸滿賽道 — 最後一名領懲罰");
  S("복불복 룰렛", "Lucky Roulette", "Ruleta de la suerte", "Rolet Untung-untungan", "運まかせルーレット", "รูเล็ตวัดดวง", "碰运气轮盘", "碰運氣輪盤");
  S("벌칙·메뉴·당번 — 돌리면 고브럽이 정해드림", "Penalties, menus, chores — spin and Goblub decides", "Castigos, menús, turnos — gira y Goblub decide", "Hukuman, menu, giliran — putar dan Goblub memutuskan", "罰ゲーム・メニュー・当番 — 回せばゴブラブが決めてくれる", "บทลงโทษ เมนู เวร — หมุนแล้ว Goblub ตัดสินให้", "惩罚·菜单·值日 — 一转Goblub帮你定", "懲罰·菜單·值日 — 一轉Goblub幫你定");
  S("우리 사이 질문 카드", "Question Cards Between Us", "Cartas de preguntas entre nosotros", "Kartu Pertanyaan Kita", "ふたりの質問カード", "การ์ดคำถามระหว่างเรา", "我们之间的问题卡", "我們之間的問題卡");
  S("커플·친구·진실게임 — 어색할 틈 없는 질문 뽑기", "Couples, friends, truth games — no awkward silence", "Parejas, amigos, verdad o reto — sin silencios incómodos", "Pasangan, teman, truth game — tanpa canggung", "カップル・友達・真実ゲーム — 気まずさゼロの質問引き", "คู่รัก เพื่อน เกมความจริง — ไม่มีช่วงเงียบเขิน", "情侣·朋友·真心话 — 不给尴尬留时间", "情侶·朋友·真心話 — 不給尷尬留時間");
  S("고브럽 작명소", "Goblub Naming House", "Casa de nombres Goblub", "Rumah Nama Goblub", "ゴブラブ名付け処", "ร้านตั้งชื่อ Goblub", "Goblub起名馆", "Goblub起名館");
  S("닉네임·펫·가게 이름 — AI가 센스있게 뚝딱", "Nicknames, pets, shops — AI names them with style", "Apodos, mascotas, tiendas — la IA los nombra con estilo", "Nickname, peliharaan, toko — AI menamai dengan gaya", "ニックネーム・ペット・お店 — AIがセンス良くパパッと", "ชื่อเล่น สัตว์เลี้ยง ร้านค้า — AI ตั้งให้แบบมีเซนส์", "昵称·宠物·店名 — AI妙笔起名", "暱稱·寵物·店名 — AI妙筆起名");
  S("마음 배달", "Heart Delivery", "Entrega de corazones", "Antar Hati", "気持ち配達", "ส่งใจ", "心意快递", "心意快遞");
  S("고백·사과·한잔 — 마음을 링크 하나로 전해요", "Confessions, apologies, drinks — send your heart in one link", "Confesiones, disculpas, brindis — tu corazón en un enlace", "Pengakuan, maaf, ajakan — kirim hatimu lewat satu tautan", "告白・謝罪・一杯 — 気持ちをリンクひとつで届けよう", "สารภาพรัก ขอโทษ ชวนดื่ม — ส่งใจผ่านลิงก์เดียว", "告白·道歉·小酌 — 一个链接传心意", "告白·道歉·小酌 — 一個連結傳心意");
  S("결정의 신", "God of Decisions", "Dios de las decisiones", "Dewa Keputusan", "決断の神", "เทพแห่งการตัดสินใจ", "决定之神", "決定之神");
  S("짜장 vs 짬뽕 — 못 정하겠으면 신이 정해줌", "Can't decide? The god decides for you", "¿No puedes decidir? El dios lo hace por ti", "Tak bisa memilih? Dewa yang memutuskan", "決められない？なら神が決めてくれる", "เลือกไม่ได้เหรอ? ให้เทพตัดสินให้", "选不出来？神替你选", "選不出來？神替你選");

  // --- 미니2 허브 ---
  S("감정 몬스터 팡팡", "Emotion Monster Whack", "Golpea monstruos emocionales", "Pukul Monster Emosi", "感情モンスターぱんぱん", "ทุบมอนสเตอร์อารมณ์", "情绪怪兽砰砰", "情緒怪獸砰砰");
  S("튀어나오는 몬스터를 팡팡! 극악 난이도 30초 점수전 🔥", "Whack the popping monsters! Brutal 30-second score battle 🔥", "¡Golpea a los monstruos! 30 segundos brutales 🔥", "Pukul monster yang muncul! Duel skor 30 detik super sulit 🔥", "飛び出すモンスターをぱんぱん！極悪難易度30秒スコア戦 🔥", "ทุบมอนสเตอร์ที่โผล่มา! ศึกทำแต้ม 30 วิสุดโหด 🔥", "打爆蹦出的怪兽！地狱难度30秒分数战 🔥", "打爆蹦出的怪獸！地獄難度30秒分數戰 🔥");
  S("고브럽 반응속도", "Goblub Reflex Test", "Reflejos Goblub", "Refleks Goblub", "ゴブラブ反射神経", "รีเฟล็กซ์ Goblub", "Goblub反应速度", "Goblub反應速度");
  S("초록불에 0.001초라도 빨리 탭! 함정 조심 — 순발력 등급전", "Tap the green light fast! Watch for traps — reflex rank battle", "¡Toca el verde rápido! Cuidado con trampas — batalla de reflejos", "Ketuk lampu hijau secepatnya! Awas jebakan — duel refleks", "青信号を0.001秒でも早くタップ！罠に注意 — 瞬発力ランク戦", "ไฟเขียวปุ๊บแตะปั๊บ! ระวังกับดัก — จัดอันดับความไว", "绿灯亮起立刻点！小心陷阱 — 反应力段位赛", "綠燈亮起立刻點！小心陷阱 — 反應力段位賽");
  S("고브럽 로또 번호 뱉기", "Goblub Lotto Numbers", "Números de lotería Goblub", "Nomor Lotre Goblub", "ゴブラブロト番号はきだし", "เลขล็อตโต้จาก Goblub", "Goblub吐乐透号码", "Goblub吐樂透號碼");
  S("고브럽이 행운 번호를 하나씩 뱉어줌 — 재미로 뽑는 랜덤!", "Goblub spits out lucky numbers one by one — random, just for fun!", "Goblub escupe números de la suerte — ¡solo por diversión!", "Goblub memuntahkan angka hoki satu per satu — acak, sekadar seru!", "ゴブラブが幸運番号をひとつずつペッ — お楽しみランダム！", "Goblub คายเลขนำโชคทีละตัว — สุ่มเอาสนุก!", "Goblub一个个吐出幸运号码 — 纯属娱乐的随机！", "Goblub一個個吐出幸運號碼 — 純屬娛樂的隨機！");
  S("밸런스 게임", "Balance Game", "Juego de dilemas", "Gim Pilihan Sulit", "二択ゲーム", "เกมเลือกข้าง", "平衡抉择", "平衡抉擇");
  S("극한의 양자택일 12연속 — 너라면 어느 쪽?", "12 impossible either-ors in a row — which side are you?", "12 dilemas imposibles seguidos — ¿de qué lado estás?", "12 pilihan mustahil beruntun — kamu pilih mana?", "極限の二者択一12連続 — あなたならどっち？", "เลือกสุดโหด 12 ข้อรวด — คุณเลือกข้างไหน?", "12连极限二选一 — 你站哪边？", "12連極限二選一 — 你站哪邊？");

  // --- 앱 페이지 ---
  S("가계부 앱", "Budget App", "App de gastos", "Aplikasi Keuangan", "家計簿アプリ", "แอปบันทึกรายจ่าย", "记账应用", "記帳應用");
  S("간단하게 쓰는 안드로이드 가계부", "A simple Android budget tracker", "Registro de gastos simple para Android", "Pencatat keuangan Android yang simpel", "手軽に使えるAndroid家計簿", "แอปบันทึกรายจ่าย Android ใช้ง่าย", "简单好用的安卓记账本", "簡單好用的安卓記帳本");
  S("여행의 순간을 기록하는 앱", "An app to capture travel moments", "App para registrar momentos de viaje", "Aplikasi pencatat momen perjalanan", "旅の瞬間を記録するアプリ", "แอปบันทึกช่วงเวลาการเดินทาง", "记录旅行瞬间的应用", "記錄旅行瞬間的應用");
  S("마음온도", "Heart Temperature", "Temperatura del corazón", "Suhu Hati", "こころ温度", "อุณหภูมิใจ", "心灵温度", "心靈溫度");
  S("마음 온도를 재는 자가성찰 웹앱", "A self-reflection app that measures your heart", "App de autorreflexión que mide tu corazón", "Aplikasi refleksi diri pengukur suhu hati", "こころの温度を測る自己省察アプリ", "เว็บแอปวัดอุณหภูมิใจเพื่อทบทวนตัวเอง", "测量心灵温度的自省应用", "測量心靈溫度的自省應用");
  S("나쁜 감정을 먹어주는 친구", "A friend that eats your bad feelings", "Un amigo que se come tus malas emociones", "Teman yang melahap emosi burukmu", "悪い感情を食べてくれる友達", "เพื่อนที่กินอารมณ์แย่ ๆ ให้คุณ", "帮你吃掉坏情绪的朋友", "幫你吃掉壞情緒的朋友");
  S("지금 즉시 만남 앱", "An instant meetup app", "App de encuentros al instante", "Aplikasi bertemu seketika", "今すぐ会えるアプリ", "แอปนัดเจอทันที", "即时见面应用", "即時見面應用");
  S("원하는 사진을 주고 받는 앱", "An app to exchange photos you love", "App para intercambiar fotos", "Aplikasi bertukar foto favorit", "好きな写真を送り合うアプリ", "แอปแลกเปลี่ยนรูปที่ชอบ", "互赠心仪照片的应用", "互贈心儀照片的應用");
  S("힘들 때 즉시 도움 받는 앱", "Get help instantly when times are hard", "Ayuda inmediata en momentos difíciles", "Bantuan seketika saat masa sulit", "つらい時すぐ助けを呼べるアプリ", "แอปขอความช่วยเหลือทันทีเมื่อลำบาก", "困难时立刻获得帮助的应用", "困難時立刻獲得幫助的應用");

  // --- 마이페이지 ---
  S("내 프로필과 별, 설정을 한곳에서", "Your profile, Stars and settings in one place", "Tu perfil, estrellas y ajustes en un lugar", "Profil, Bintang & pengaturan dalam satu tempat", "プロフィール・スター・設定をひとまとめに", "โปรไฟล์ ดาว และการตั้งค่าในที่เดียว", "个人资料、星星和设置一站搞定", "個人資料、星星和設定一站搞定");
  S("구글 계정으로 3초 만에 시작해요.", "Start in 3 seconds with your Google account.", "Empieza en 3 segundos con tu cuenta de Google.", "Mulai dalam 3 detik dengan akun Google.", "Googleアカウントで3秒スタート。", "เริ่มได้ใน 3 วินาทีด้วยบัญชี Google", "用谷歌账号3秒开始。", "用Google帳號3秒開始。");
  S("로그인하면 이 페이지에서 별·설정·프로필 카드를 한 번에 관리할 수 있어요.", "Log in to manage your Stars, settings and profile card here.", "Inicia sesión para gestionar estrellas, ajustes y tu tarjeta.", "Masuk untuk mengelola Bintang, pengaturan & kartu profil.", "ログインするとスター・設定・プロフィールカードをまとめて管理できます。", "เข้าสู่ระบบเพื่อจัดการดาว การตั้งค่า และการ์ดโปรไฟล์", "登录后可在此管理星星、设置和资料卡。", "登入後可在此管理星星、設定和資料卡。");
  S("지금은 로그인 없이도 모든 콘텐츠를 즐길 수 있어요 🙂", "You can enjoy everything without logging in 🙂", "Puedes disfrutar todo sin iniciar sesión 🙂", "Semua konten bisa dinikmati tanpa login 🙂", "今はログインなしでも全コンテンツ遊べます 🙂", "ตอนนี้เล่นได้ทุกอย่างโดยไม่ต้องล็อกอิน 🙂", "现在不登录也能玩所有内容 🙂", "現在不登入也能玩所有內容 🙂");
  S("⭐ 보유 별", "⭐ My Stars", "⭐ Mis estrellas", "⭐ Bintang Saya", "⭐ 保有スター", "⭐ ดาวของฉัน", "⭐ 我的星星", "⭐ 我的星星");
  S("별", "Stars", "Estrellas", "Bintang", "スター", "ดาว", "星星", "星星");
  S("✨프리미엄 풀이에 쓸 수 있어요 — 별 충전이 곧 열려요.", "✨Use them on premium readings — top-up opens soon.", "✨Úsalas en lecturas premium — recarga pronto.", "✨Pakai untuk bacaan premium — isi ulang segera dibuka.", "✨プレミアム鑑定に使えます — チャージは近日オープン。", "✨ใช้กับคำทำนายพรีเมียมได้ — เติมดาวเปิดเร็ว ๆ นี้", "✨可用于高级解读 — 充值即将开放。", "✨可用於高級解讀 — 儲值即將開放。");
  S("🎫 나의 프로필 카드", "🎫 My Profile Card", "🎫 Mi tarjeta de perfil", "🎫 Kartu Profil Saya", "🎫 マイプロフィールカード", "🎫 การ์ดโปรไฟล์ของฉัน", "🎫 我的资料卡", "🎫 我的資料卡");
  S("보러 가기 →", "View →", "Ver →", "Lihat →", "見に行く →", "ดูเลย →", "去看看 →", "去看看 →");
  S("사주·MBTI·연애세포까지 — 흩어진 내 결과를 한 장으로 모아 자랑해요.", "Saju, MBTI, love cells — gather all your results on one card.", "Saju, MBTI y más — reúne tus resultados en una tarjeta.", "Saju, MBTI, sel cinta — kumpulkan hasilmu dalam satu kartu.", "四柱・MBTI・恋愛細胞まで — 結果を一枚にまとめて自慢しよう。", "รวมผลดวง MBTI เซลล์รัก — อวดในการ์ดใบเดียว", "四柱·MBTI·恋爱细胞 — 把结果集成一张卡炫耀。", "四柱·MBTI·戀愛細胞 — 把結果集成一張卡炫耀。");
  S("⚙️ 설정", "⚙️ Settings", "⚙️ Ajustes", "⚙️ Pengaturan", "⚙️ 設定", "⚙️ การตั้งค่า", "⚙️ 设置", "⚙️ 設定");
  S("떠다니는 고브럽 마스코트 표시", "Show floating Goblub mascot", "Mostrar mascota Goblub flotante", "Tampilkan maskot Goblub melayang", "浮遊ゴブラブマスコットを表示", "แสดงมาสคอต Goblub ลอยได้", "显示漂浮的Goblub吉祥物", "顯示漂浮的Goblub吉祥物");
  S("끄면 화면에서 바로 사라져요", "Turn off to hide it instantly", "Al apagarlo desaparece al instante", "Matikan untuk langsung menyembunyikan", "オフにするとすぐ消えます", "ปิดแล้วหายทันที", "关闭后立即消失", "關閉後立即消失");
  S("사주 프로필", "Saju Profile", "Perfil de saju", "Profil Saju", "四柱プロフィール", "โปรไฟล์ดวงชะตา", "四柱档案", "四柱檔案");
  S("저장된 프로필 없음", "No saved profile", "Sin perfil guardado", "Belum ada profil", "保存されたプロフィールなし", "ยังไม่มีโปรไฟล์", "暂无保存的档案", "暫無保存的檔案");
  S("수정하기", "Edit", "Editar", "Ubah", "編集", "แก้ไข", "编辑", "編輯");
  S("전체 데이터 초기화", "Reset all data", "Restablecer todos los datos", "Reset semua data", "全データ初期化", "รีเซ็ตข้อมูลทั้งหมด", "重置全部数据", "重置全部數據");
  S("별·테스트 기록 등 이 기기의 모든 goblub 데이터 삭제", "Delete all goblub data on this device (Stars, test records…)", "Borra todos los datos de goblub en este dispositivo", "Hapus semua data goblub di perangkat ini", "この端末のgoblubデータ（スター・テスト記録など）を全削除", "ลบข้อมูล goblub ทั้งหมดในเครื่องนี้", "删除本设备上所有goblub数据（星星·测试记录等）", "刪除本裝置上所有goblub數據（星星·測試記錄等）");
  S("초기화", "Reset", "Restablecer", "Reset", "初期化", "รีเซ็ต", "重置", "重置");
  S("💳 결제", "💳 Payments", "💳 Pagos", "💳 Pembayaran", "💳 決済", "💳 การชำระเงิน", "💳 支付", "💳 支付");
  S("준비 중", "Coming soon", "Próximamente", "Segera hadir", "準備中", "เร็ว ๆ นี้", "敬请期待", "敬請期待");
  S("별 충전과 프리미엄 상품 결제를 준비하고 있어요. 조금만 기다려주세요! ⭐", "Star top-ups and premium purchases are on the way! ⭐", "Recargas y compras premium en camino. ¡Espéralo! ⭐", "Isi ulang Bintang & pembelian premium segera hadir! ⭐", "スターチャージとプレミアム決済を準備中。もう少しお待ちを！⭐", "เติมดาวและสินค้าพรีเมียมกำลังมา รอสักครู่นะ! ⭐", "星星充值与高级商品支付即将上线！⭐", "星星儲值與高級商品支付即將上線！⭐");
  S("모든 데이터는 이 브라우저에 저장돼요", "All data is stored in this browser", "Todos los datos se guardan en este navegador", "Semua data tersimpan di peramban ini", "すべてのデータはこのブラウザに保存されます", "ข้อมูลทั้งหมดถูกเก็บในเบราว์เซอร์นี้", "所有数据仅保存在此浏览器", "所有數據僅保存在此瀏覽器");
  S("가볍게 즐겨주세요 🙂", "Just for fun 🙂", "Solo por diversión 🙂", "Sekadar hiburan 🙂", "気軽に楽しんでね 🙂", "เล่นเพลิน ๆ นะ 🙂", "轻松一玩就好 🙂", "輕鬆一玩就好 🙂");

  // --- 퀴즈 공통 UI ---
  S("시작하기", "Start", "Empezar", "Mulai", "スタート", "เริ่มเลย", "开始", "開始");
  S("다시하기", "Try again", "Otra vez", "Ulangi", "もう一回", "เล่นอีกครั้ง", "再来一次", "再來一次");
  S("링크 복사", "Copy link", "Copiar enlace", "Salin tautan", "リンクをコピー", "คัดลอกลิงก์", "复制链接", "複製連結");
  S("공유 완료!", "Shared!", "¡Compartido!", "Terbagikan!", "共有しました！", "แชร์แล้ว!", "已分享！", "已分享！");
  S("복사됨!", "Copied!", "¡Copiado!", "Tersalin!", "コピーしました！", "คัดลอกแล้ว!", "已复制！", "已複製！");
  S("🖼 결과 짤 저장", "🖼 Save result image", "🖼 Guardar imagen", "🖼 Simpan gambar hasil", "🖼 結果画像を保存", "🖼 บันทึกรูปผลลัพธ์", "🖼 保存结果图", "🖼 保存結果圖");

  // --- 버디 대사 ---
  S("냠냠, 나쁜 기분 없어?", "Nom nom, got any bad moods?", "Ñam ñam, ¿tienes malos ánimos?", "Nyam nyam, ada mood buruk?", "むしゃむしゃ、嫌な気分ない？", "งั่ม ๆ มีอารมณ์แย่ ๆ ไหม?", "吧唧吧唧，有坏心情吗？", "吧唧吧唧，有壞心情嗎？");
  S("오늘도 잘 놀다 가!", "Have fun again today!", "¡Diviértete hoy también!", "Hari ini juga bersenang-senanglah!", "今日も楽しんでいってね！", "วันนี้ก็ขอให้สนุกนะ!", "今天也玩得开心！", "今天也玩得開心！");
  S("심심하면 날 눌러줘~", "Tap me if you're bored~", "Tócame si te aburres~", "Ketuk aku kalau bosan~", "ヒマならボクを押してね〜", "เบื่อเมื่อไหร่แตะฉันนะ~", "无聊就点点我~", "無聊就點點我~");
  S("안 좋은 일은 나한테 던져!", "Throw your troubles at me!", "¡Lánzame tus problemas!", "Lempar masalahmu padaku!", "嫌なことはボクに投げて！", "เรื่องแย่ ๆ โยนมาให้ฉัน!", "不开心的事丢给我！", "不開心的事丟給我！");
  S("우걱우걱… 스트레스 맛있다", "Chomp chomp… stress is delicious", "Ñam ñam… el estrés está rico", "Nyam nyam… stres itu lezat", "もぐもぐ…ストレスおいしい", "งั่ม ๆ … ความเครียดอร่อยดี", "大口大口…压力真好吃", "大口大口…壓力真好吃");
  S("히히, 잡았다 요놈!", "Hehe, gotcha!", "Jeje, ¡te atrapé!", "Hihi, kena kamu!", "へへ、つかまえた！", "ฮิฮิ จับได้แล้ว!", "嘿嘿，抓到你啦！", "嘿嘿，抓到你啦！");
  S("운세 한 번 보고 갈래?", "Wanna check your fortune?", "¿Quieres ver tu fortuna?", "Mau cek peruntungan?", "運勢見ていかない？", "ดูดวงสักหน่อยไหม?", "要不要看看运势？", "要不要看看運勢？");
  S("오늘의 타로 뽑았어?", "Drawn today's tarot yet?", "¿Ya sacaste tu tarot de hoy?", "Sudah tarik tarot hari ini?", "今日のタロット引いた？", "จั่วไพ่ทาโรต์วันนี้หรือยัง?", "抽过今天的塔罗了吗？", "抽過今天的塔羅了嗎？");
  S("기분 꿀꺽— 개운하지?", "Gulp— feel refreshed?", "Glup— ¿te sientes mejor?", "Glek— lega kan?", "気分ごっくん— スッキリでしょ？", "อึก— โล่งใจแล้วใช่ไหม?", "咕嘟—舒服多了吧？", "咕嘟—舒服多了吧？");
  S("같이 놀자!", "Let's play together!", "¡Juguemos juntos!", "Ayo main bareng!", "一緒に遊ぼう！", "มาเล่นด้วยกัน!", "一起玩吧！", "一起玩吧！");

  // ===== 엔진 =====
  // HTML 원문엔 NBSP(U+00A0) 등이 섞여 있어 키를 정규화해 조회한다
  function norm(s) { return s.replace(/[   　]/g, " "); }
  function look(s) {
    if (s == null) return null;
    var e = D[s] || D[norm(s)];
    return (e && e[lang]) || null;
  }
  function t(s) {
    if (lang === "ko" || s == null) return s;
    return look(s) || s;
  }
  function walk(node) {
    if (node.nodeType === 3) {
      var raw = node.nodeValue, k = raw.trim();
      if (!k) return;
      var tr = look(k);
      if (tr) node.nodeValue = raw.replace(k, tr);
      return;
    }
    if (node.nodeType !== 1) return;
    var tag = node.tagName;
    if (tag === "SCRIPT" || tag === "STYLE" || tag === "NOSCRIPT") return;
    ["placeholder", "title", "data-soon", "aria-label"].forEach(function (a) {
      var v = node.getAttribute && node.getAttribute(a);
      if (v) { var tv = look(v.trim()); if (tv) node.setAttribute(a, tv); }
    });
    for (var i = 0; i < node.childNodes.length; i++) walk(node.childNodes[i]);
  }
  function apply(root) { if (lang !== "ko") walk(root || document.body); }

  // ===== 언어 선택기 (🌐 왼쪽 위) =====
  function buildPicker() {
    var css = document.createElement("style");
    css.textContent =
      ".gb-lang{position:fixed;top:14px;left:14px;z-index:70;}" +
      ".gb-lang-btn{font-size:1.15rem;line-height:1;padding:8px 10px;border-radius:999px;cursor:pointer;font-family:inherit;" +
      "background:linear-gradient(180deg,rgba(255,255,255,.22),rgba(255,255,255,.10));border:1.5px solid rgba(255,255,255,.45);" +
      "box-shadow:0 8px 20px rgba(0,20,30,.35),inset 0 1px 0 rgba(255,255,255,.55);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);color:#fff;}" +
      ".gb-lang-menu{display:none;position:absolute;top:44px;left:0;min-width:158px;background:rgba(20,26,58,.96);" +
      "border:1.5px solid rgba(255,255,255,.35);border-radius:14px;padding:6px;box-shadow:0 14px 34px rgba(0,10,30,.5);backdrop-filter:blur(10px);}" +
      ".gb-lang.on .gb-lang-menu{display:block;}" +
      ".gb-lang-menu button{display:block;width:100%;text-align:left;background:none;border:0;color:#e8ecff;font-family:inherit;" +
      "font-size:.92rem;padding:8px 12px;border-radius:9px;cursor:pointer;}" +
      ".gb-lang-menu button:hover{background:rgba(255,255,255,.14);}" +
      ".gb-lang-menu button.cur{color:#ffd57e;font-weight:bold;}";
    document.head.appendChild(css);
    var wrap = document.createElement("div"); wrap.className = "gb-lang";
    var btn = document.createElement("button"); btn.className = "gb-lang-btn"; btn.type = "button";
    btn.textContent = "🌐"; btn.setAttribute("aria-label", "Language");
    var menu = document.createElement("div"); menu.className = "gb-lang-menu";
    LANGS.forEach(function (l) {
      var b = document.createElement("button"); b.type = "button";
      b.textContent = l.n; if (l.c === lang) b.className = "cur";
      b.onclick = function () {
        try { localStorage.setItem("goblub_lang", l.c); } catch (e) {}
        location.reload();
      };
      menu.appendChild(b);
    });
    wrap.appendChild(btn); wrap.appendChild(menu);
    btn.onclick = function (e) { e.stopPropagation(); wrap.classList.toggle("on"); };
    document.addEventListener("click", function (e) { if (!wrap.contains(e.target)) wrap.classList.remove("on"); });
    document.body.appendChild(wrap);
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (lang !== "ko") document.documentElement.lang = (lang === "tw" ? "zh-Hant" : lang === "zh" ? "zh-Hans" : lang);
    buildPicker();
    apply();
    setTimeout(function () { apply(); }, 400);   // 늦게 그려지는 요소(허브 팬 등) 재적용
    window.addEventListener("load", function () { apply(); });
  });

  // 페이지별 언어팩 등록: { "한국어 키": [en,es,id,ja,th,zh,tw] } 또는 객체형
  function add(pairs) {
    for (var k in pairs) {
      var v = pairs[k];
      D[k] = Array.isArray(v) ? { en: v[0], es: v[1], id: v[2], ja: v[3], th: v[4], zh: v[5], tw: v[6] } : v;
    }
  }
  window.GoblubI18n = { t: t, lang: lang, apply: apply, add: add, LANGS: LANGS };
})();
