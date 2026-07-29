// 신살(神煞) 계산 엔진 — 고전 표 그대로. window.Sinsal = { list(r) }
// r = Saju.compute(...) 결과. pillars.{year,month,day,hour} = [간index, 지index], ilgan = 간index
//
// 각 표의 근거를 주석에 남긴다(검증용).
//   지지 index: 0자 1축 2인 3묘 4진 5사 6오 7미 8신 9유 10술 11해
//   천간 index: 0갑 1을 2병 3정 4무 5기 6경 7신 8임 9계
(function () {
  var GAN = ["갑","을","병","정","무","기","경","신","임","계"];
  var JI  = ["자","축","인","묘","진","사","오","미","신","유","술","해"];
  var GAN_HJ = ["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"];
  var JI_HJ  = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];
  var POS = { year:"년지", month:"월지", day:"일지", hour:"시지" };
  var POS_JU = { year:"년주", month:"월주", day:"일주", hour:"시주" };

  /* ── 십이신살 ──
     삼합국의 왕지(旺支)에서 겁살 = 왕지+5, 이후 지지 순서대로 12신살이 배치된다.
       신자진(수국) 왕=자 → 겁살 사   / 인오술(화국) 왕=오 → 겁살 해
       사유축(금국) 왕=유 → 겁살 인   / 해묘미(목국) 왕=묘 → 겁살 신
     검산: 신자진 기준 유=연살(도화), 인=역마, 진=화개 ✓ */
  var S12 = ["겁살","재살","천살","지살","연살","월살","망신살","장성살","반안살","역마살","육해살","화개살"];
  var SAMHAP = [
    { set:[8,0,4], wang:0 },   // 신자진
    { set:[5,9,1], wang:9 },   // 사유축
    { set:[2,6,10], wang:6 },  // 인오술
    { set:[11,3,7], wang:3 }   // 해묘미
  ];
  function wangOf(ji){ for(var i=0;i<SAMHAP.length;i++) if(SAMHAP[i].set.indexOf(ji)>=0) return SAMHAP[i].wang; return null; }
  function s12Of(baseJi, targetJi){
    var w = wangOf(baseJi); if(w===null) return null;
    var start = (w + 5) % 12;                 // 겁살 자리
    return S12[(targetJi - start + 12) % 12];
  }

  /* ── 공망(空亡) — 일주 기준 순중공망 ──
     60갑자를 갑○로 시작하는 6순으로 끊고, 그 순에 없는 지지 두 개가 공망.
     순 시작 지지 = (일지 - 일간 + 12) % 12, 공망 = 시작+10, 시작+11
     검산: 갑자일 → 시작 자 → 공망 술·해 ✓ / 갑술일 → 시작 술 → 공망 신·유 ✓ */
  function gongmangOf(gan, ji){
    var start = (ji - gan + 12) % 12;
    return [(start + 10) % 12, (start + 11) % 12];
  }

  // 양인(羊刃) — 양간만. 갑묘 병오 무오 경유 임자
  var YANGIN = { 0:3, 2:6, 4:6, 6:9, 8:0 };
  // 천을귀인 — 갑무경:축미 / 을기:자신 / 병정:해유 / 신(辛):인오 / 임계:사묘
  var CHEONEUL = [[1,7],[0,8],[11,9],[11,9],[1,7],[0,8],[1,7],[2,6],[5,3],[5,3]];
  // 문창귀인 — 갑사 을오 병신 정유 무신 기유 경해 신자 임인 계묘
  var MUNCHANG = [5,6,8,9,8,9,11,0,2,3];
  // 금여(金輿) — 갑진 을사 병미 정신 무미 기신 경술 신해 임축 계인
  var GEUMYEO  = [4,5,7,8,7,8,10,11,1,2];
  // 홍염살 — 갑오 을오 병인 정미 무진 기진 경술 신유 임자 계신
  var HONGYEOM = [6,6,2,7,4,4,10,9,0,8];
  /* 암록(暗祿) — 일간의 건록지와 육합하는 지지.
     건록 갑寅 을卯 병巳 정午 무巳 기午 경申 신酉 임亥 계子 → 육합 → 해술신미신미사진인축 */
  var AMROK = [11,10,8,7,8,7,5,4,2,1];
  /* 천덕귀인(天德貴人) — 월지 기준. 인월丁 묘월申 진월壬 사월辛 오월亥 미월甲
     신월癸 유월寅 술월丙 해월乙 자월巳 축월庚  (t:"gan"|"ji") */
  var CHEONDEOK = {
    2:{t:"gan",v:3}, 3:{t:"ji",v:8},  4:{t:"gan",v:8}, 5:{t:"gan",v:7},
    6:{t:"ji",v:11}, 7:{t:"gan",v:0}, 8:{t:"gan",v:9}, 9:{t:"ji",v:2},
    10:{t:"gan",v:2},11:{t:"gan",v:1},0:{t:"ji",v:5},  1:{t:"gan",v:6}
  };
  // 월덕귀인(月德貴人) — 월지 삼합국 기준 천간. 인오술丙 신자진壬 사유축庚 해묘미甲
  function woldeokGan(monthJi){
    if([2,6,10].indexOf(monthJi)>=0) return 2;   // 병
    if([8,0,4].indexOf(monthJi)>=0)  return 8;   // 임
    if([5,9,1].indexOf(monthJi)>=0)  return 6;   // 경
    return 0;                                    // 갑 (해묘미)
  }
  /* 십이운성(포태법) — 일간의 장생지에서 양간은 순행, 음간은 역행.
     장생 갑亥 을午 병寅 정酉 무寅 기酉 경巳 신子 임申 계卯
     검산: 갑 건록=인(甲祿在寅) ✓, 경 제왕=유(경 양인=유) ✓ */
  var UNSEONG = ["장생","목욕","관대","건록","제왕","쇠","병","사","묘","절","태","양"];
  var JANGSAENG = [11,6,2,9,2,9,5,0,8,3];
  function unseongOf(ilgan, ji){
    var s = JANGSAENG[ilgan], fwd = (ilgan % 2 === 0);
    var step = fwd ? (ji - s + 12) % 12 : (s - ji + 12) % 12;
    return UNSEONG[step];
  }
  // 괴강 — 일주 경진·경술·임진·임술
  var GOEGANG = ["경진","경술","임진","임술"];
  // 백호대살 — 갑진 을미 병술 정축 무진 임술 계축 (각 주 간지)
  var BAEKHO = ["갑진","을미","병술","정축","무진","임술","계축"];
  // 원진 — 자미 축오 인유 묘신 진해 사술
  var WONJIN = { "0-7":1,"1-6":1,"2-9":1,"3-8":1,"4-11":1,"5-10":1 };
  // 귀문관살 — 자유 축오 인미 묘신 진해 사술
  var GWIMUN = { "0-9":1,"1-6":1,"2-7":1,"3-8":1,"4-11":1,"5-10":1 };
  // 현침살 — 갑·신(辛)·묘·오·미·신(申)
  var HYEONCHIM_GAN = { 0:1, 7:1 }, HYEONCHIM_JI = { 3:1, 6:1, 7:1, 8:1 };
  // 고신·과숙 — 년지 계절 기준. 해자축→고신 인/과숙 술, 인묘진→사/축, 사오미→신/진, 신유술→해/미
  function gosinGwasuk(yearJi){
    if([11,0,1].indexOf(yearJi)>=0) return { gosin:2, gwasuk:10 };
    if([2,3,4].indexOf(yearJi)>=0)  return { gosin:5, gwasuk:1 };
    if([5,6,7].indexOf(yearJi)>=0)  return { gosin:8, gwasuk:4 };
    return { gosin:11, gwasuk:7 };   // 신유술
  }

  function pkey(a,b){ return a<b ? a+"-"+b : b+"-"+a; }

  function list(r){
    var P = r.pillars, ilgan = r.ilgan;
    var keys = ["year","month","day","hour"].filter(function(k){ return P[k]; });
    var out = [], idx = {};
    function push(name, where, basis){
      if(!idx[name]) { idx[name] = { name:name, hits:[], basis:basis||"" }; out.push(idx[name]); }
      if(idx[name].hits.indexOf(where) < 0) idx[name].hits.push(where);
      if(basis && idx[name].basis.indexOf(basis) < 0)
        idx[name].basis = idx[name].basis ? idx[name].basis + " · " + basis : basis;
    }

    // 1) 십이신살 — 년지 기준과 일지 기준 둘 다(정통 두 방식)
    [["year","년지 기준"],["day","일지 기준"]].forEach(function(b){
      var baseJi = P[b[0]][1];
      keys.forEach(function(k){
        var nm = s12Of(baseJi, P[k][1]);
        if(nm) push(nm, POS[k] + " " + JI[P[k][1]], b[1]);
      });
    });

    // 2) 공망 — 일주 기준
    var gm = gongmangOf(P.day[0], P.day[1]);
    keys.forEach(function(k){
      if(k !== "day" && gm.indexOf(P[k][1]) >= 0) push("공망", POS[k] + " " + JI[P[k][1]], "일주 기준");
    });

    // 3) 일간 기준 신살
    keys.forEach(function(k){
      var ji = P[k][1];
      if(YANGIN[ilgan] === ji) push("양인살", POS[k] + " " + JI[ji], "일간 기준");
      if(CHEONEUL[ilgan].indexOf(ji) >= 0) push("천을귀인", POS[k] + " " + JI[ji], "일간 기준");
      if(MUNCHANG[ilgan] === ji) push("문창귀인", POS[k] + " " + JI[ji], "일간 기준");
      if(GEUMYEO[ilgan] === ji) push("금여", POS[k] + " " + JI[ji], "일간 기준");
      if(HONGYEOM[ilgan] === ji) push("홍염살", POS[k] + " " + JI[ji], "일간 기준");
      if(AMROK[ilgan] === ji) push("암록", POS[k] + " " + JI[ji], "일간 기준");
    });

    // 3-2) 월지 기준 귀인 — 천덕·월덕
    var cd = CHEONDEOK[P.month[1]];
    if(cd) keys.forEach(function(k){
      if(cd.t === "gan" && P[k][0] === cd.v) push("천덕귀인", POS_JU[k] + " " + GAN[cd.v], "월지 기준");
      if(cd.t === "ji"  && P[k][1] === cd.v) push("천덕귀인", POS[k] + " " + JI[cd.v], "월지 기준");
    });
    var wd = woldeokGan(P.month[1]);
    keys.forEach(function(k){
      if(P[k][0] === wd) push("월덕귀인", POS_JU[k] + " " + GAN[wd], "월지 기준");
    });

    // 4) 간지 조합 — 괴강(일주)·백호(각 주)
    var ilju = GAN[P.day[0]] + JI[P.day[1]];
    if(GOEGANG.indexOf(ilju) >= 0) push("괴강살", "일주 " + ilju, "일주 간지");
    keys.forEach(function(k){
      var gj = GAN[P[k][0]] + JI[P[k][1]];
      if(BAEKHO.indexOf(gj) >= 0) push("백호대살", POS_JU[k] + " " + gj, "간지 조합");
    });

    // 5) 지지 쌍 — 원진·귀문
    for(var a=0;a<keys.length;a++) for(var b2=a+1;b2<keys.length;b2++){
      var j1=P[keys[a]][1], j2=P[keys[b2]][1], key=pkey(j1,j2);
      var pair = POS[keys[a]] + " " + JI[j1] + " ↔ " + POS[keys[b2]] + " " + JI[j2];
      if(WONJIN[key]) push("원진살", pair, "지지 쌍");
      if(GWIMUN[key]) push("귀문관살", pair, "지지 쌍");
    }

    // 6) 현침살 — 해당 글자가 원국에 있으면
    keys.forEach(function(k){
      if(HYEONCHIM_GAN[P[k][0]]) push("현침살", POS_JU[k] + " " + GAN[P[k][0]], "글자 기준");
      if(HYEONCHIM_JI[P[k][1]]) push("현침살", POS[k] + " " + JI[P[k][1]], "글자 기준");
    });

    // 7) 고신·과숙 — 년지 기준
    var gg = gosinGwasuk(P.year[1]);
    keys.forEach(function(k){
      if(k === "year") return;
      if(P[k][1] === gg.gosin) push("고신살", POS[k] + " " + JI[P[k][1]], "년지 기준");
      if(P[k][1] === gg.gwasuk) push("과숙살", POS[k] + " " + JI[P[k][1]], "년지 기준");
    });

    // 8) 천라지망 — 술해(천라)·진사(지망)가 함께 있을 때
    var jis = keys.map(function(k){ return P[k][1]; });
    if(jis.indexOf(10)>=0 && jis.indexOf(11)>=0) push("천라(天羅)", "술·해 동주", "지지 조합");
    if(jis.indexOf(4)>=0 && jis.indexOf(5)>=0) push("지망(地網)", "진·사 동주", "지지 조합");

    return out;
  }

  // 원국 표기(검증용) — 년월일시 간지 + 십이운성
  function wongook(r){
    var P = r.pillars, o = [];
    ["year","month","day","hour"].forEach(function(k){
      if(!P[k]) return;
      o.push({ pos: POS_JU[k],
        hj: GAN_HJ[P[k][0]] + JI_HJ[P[k][1]],
        ko: GAN[P[k][0]] + JI[P[k][1]],
        unseong: unseongOf(r.ilgan, P[k][1]) });
    });
    return o;
  }

  // 공망 지지(표시용)
  function gongmangJi(r){
    var g = gongmangOf(r.pillars.day[0], r.pillars.day[1]);
    return { ko: JI[g[0]] + "·" + JI[g[1]], hj: JI_HJ[g[0]] + "·" + JI_HJ[g[1]] };
  }

  window.Sinsal = { list: list, wongook: wongook, gongmangJi: gongmangJi,
    unseongOf: unseongOf, S12: S12 };
})();
