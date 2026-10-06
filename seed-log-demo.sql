-- Demo content for /log (placeholder, replaceable).
-- Copyright note: the Japanese prose below is ORIGINAL text written for this
-- placeholder set — it is NOT a translation of any published edition. Only the
-- two short original-language fragments are quoted, both public domain
-- (Montaigne d.1592, Kafka d.1924), each attributed in the body.
-- Run: wrangler d1 execute sui-sari-log --local --file=seed-log-demo.sql

DELETE FROM pages WHERE slug IN (
  'des-senteurs','shikii','asa-no-kiroku','mori-no-kioku','kaori-to-kioku','henshin-no-asa'
);

INSERT INTO pages (id, slug, title, date, cover, status, draft_blocks, published_blocks, updated_at, published_at) VALUES

('pg_senteurs','des-senteurs','匂いについて','2026-07-22','/media/shop/mori-no-hibiki/2.jpg','published',
'[{"id":"b1","type":"title","text":"匂いについて"},
  {"id":"b2","type":"text","text":"モンテーニュは『エセー』に「匂いについて」という短い章を置いた。四百年以上前の人が、香りを主題に一章を割いていたという事実そのものが、いつも励ましになる。"},
  {"id":"b3","type":"image","src":"/media/shop/mori-no-hibiki/2.jpg","alt":"","caption":"檜の蒸留"},
  {"id":"b4","type":"text","text":"彼はそこで、良い香りとは何も足されていない状態のことだ、という趣旨のことを書いている。Le plus parfait senteur d''une femme, c''est de ne sentir à rien.（モンテーニュ『エセー』第一巻五十五章）\n\n何もにおわないことが最上である、という一文は、香りをつくる立場からするとほとんど挑発に近い。けれど毎年、素材を蒸留するたびにこの言葉に戻ってくる。足すために香るのではなく、その人がもともと持っている気配を、そっと輪郭づけるために香るのだと。"},
  {"id":"b5","type":"text","text":"奥伊勢の森で檜をいただくとき、水も一緒にいただく。土地の水で蒸留した檜は、別の水で蒸したものとは明らかに違う顔をする。素材だけを持ち帰っても、その香りにはならない。"}]',
'[{"id":"b1","type":"title","text":"匂いについて"},
  {"id":"b2","type":"text","text":"モンテーニュは『エセー』に「匂いについて」という短い章を置いた。四百年以上前の人が、香りを主題に一章を割いていたという事実そのものが、いつも励ましになる。"},
  {"id":"b3","type":"image","src":"/media/shop/mori-no-hibiki/2.jpg","alt":"","caption":"檜の蒸留"},
  {"id":"b4","type":"text","text":"彼はそこで、良い香りとは何も足されていない状態のことだ、という趣旨のことを書いている。Le plus parfait senteur d''une femme, c''est de ne sentir à rien.（モンテーニュ『エセー』第一巻五十五章）\n\n何もにおわないことが最上である、という一文は、香りをつくる立場からするとほとんど挑発に近い。けれど毎年、素材を蒸留するたびにこの言葉に戻ってくる。足すために香るのではなく、その人がもともと持っている気配を、そっと輪郭づけるために香るのだと。"},
  {"id":"b5","type":"text","text":"奥伊勢の森で檜をいただくとき、水も一緒にいただく。土地の水で蒸留した檜は、別の水で蒸したものとは明らかに違う顔をする。素材だけを持ち帰っても、その香りにはならない。"}]',
'2026-07-22T00:00:00.000Z','2026-07-22T00:00:00.000Z'),

('pg_shikii','shikii','門の前で','2026-07-08','/media/shop/drei-3-forest/3.jpg','published',
'[{"id":"b1","type":"title","text":"門の前で"},
  {"id":"b2","type":"text","text":"カフカに、門の前で待ちつづける男の短い話がある。門は最初から開いている。それでも男は許しを待って、一生を門の前で過ごしてしまう。"},
  {"id":"b3","type":"text","text":"調香をしていると、この話を思い出すことがある。素材は目の前にある。手を動かせばいい。それだけのことなのに、正解を待って動けなくなる時期が、何年かに一度やってくる。"},
  {"id":"b4","type":"image","src":"/media/shop/drei-3-forest/3.jpg","alt":"","caption":"ランケ、湖畔"},
  {"id":"b5","type":"text","text":"そういうとき、教えてもらったとおりに自分の肌の匂いを嗅ぐ。すると不思議と、待つのをやめられる。門は開いていた、と気づくのではなく、門のことを忘れる、という感じに近い。"},
  {"id":"b6","type":"text","text":"作品はいつも、待つのをやめたところから動きはじめる。"}]',
'[{"id":"b1","type":"title","text":"門の前で"},
  {"id":"b2","type":"text","text":"カフカに、門の前で待ちつづける男の短い話がある。門は最初から開いている。それでも男は許しを待って、一生を門の前で過ごしてしまう。"},
  {"id":"b3","type":"text","text":"調香をしていると、この話を思い出すことがある。素材は目の前にある。手を動かせばいい。それだけのことなのに、正解を待って動けなくなる時期が、何年かに一度やってくる。"},
  {"id":"b4","type":"image","src":"/media/shop/drei-3-forest/3.jpg","alt":"","caption":"ランケ、湖畔"},
  {"id":"b5","type":"text","text":"そういうとき、教えてもらったとおりに自分の肌の匂いを嗅ぐ。すると不思議と、待つのをやめられる。門は開いていた、と気づくのではなく、門のことを忘れる、という感じに近い。"},
  {"id":"b6","type":"text","text":"作品はいつも、待つのをやめたところから動きはじめる。"}]',
'2026-07-08T00:00:00.000Z','2026-07-08T00:00:00.000Z'),

('pg_asa','asa-no-kiroku','ある朝、目を覚ますと','2026-06-18','/media/shop/es-your-skin/1.jpg','published',
'[{"id":"b1","type":"title","text":"ある朝、目を覚ますと"},
  {"id":"b2","type":"text","text":"Als Gregor Samsa eines Morgens aus unruhigen Träumen erwachte …（カフカ『変身』冒頭）\n\n落ち着かない夢から覚めた朝、というだけの一節が、なぜあれほど身体に残るのだろう。"},
  {"id":"b3","type":"text","text":"香りの記憶も、たいてい朝に属している。前の晩に何を焚いたかは忘れても、翌朝の部屋に残った気配は覚えている。香りは、立ちのぼる瞬間よりも、引いていく途中のほうが正体を見せる。"},
  {"id":"b4","type":"image","src":"/media/shop/es-your-skin/1.jpg","alt":"","caption":""},
  {"id":"b5","type":"text","text":"だから調香では、最後まで残るものを先に決める。消えぎわに何を置くか。それが決まっていれば、上に何を重ねても崩れない。"}]',
'[{"id":"b1","type":"title","text":"ある朝、目を覚ますと"},
  {"id":"b2","type":"text","text":"Als Gregor Samsa eines Morgens aus unruhigen Träumen erwachte …（カフカ『変身』冒頭）\n\n落ち着かない夢から覚めた朝、というだけの一節が、なぜあれほど身体に残るのだろう。"},
  {"id":"b3","type":"text","text":"香りの記憶も、たいてい朝に属している。前の晩に何を焚いたかは忘れても、翌朝の部屋に残った気配は覚えている。香りは、立ちのぼる瞬間よりも、引いていく途中のほうが正体を見せる。"},
  {"id":"b4","type":"image","src":"/media/shop/es-your-skin/1.jpg","alt":"","caption":""},
  {"id":"b5","type":"text","text":"だから調香では、最後まで残るものを先に決める。消えぎわに何を置くか。それが決まっていれば、上に何を重ねても崩れない。"}]',
'2026-06-18T00:00:00.000Z','2026-06-18T00:00:00.000Z'),

('pg_mori','mori-no-kioku','森で拾ったもの','2026-05-30','/media/shop/drei-3-forest/6.jpg','published',
'[{"id":"b1","type":"title","text":"森で拾ったもの"},
  {"id":"b2","type":"text","text":"三人で森を歩いた記憶から作品をつくったとき、採集したのは香りだけではなかった。ヨーロッパトウヒ、ブナ、クロモジ。ポケットに入れて持ち帰った木片は、いまも机の上にある。"},
  {"id":"b3","type":"image","src":"/media/shop/drei-3-forest/6.jpg","alt":"","caption":""},
  {"id":"b4","type":"text","text":"五十八種類を重ねると、ふつうは輪郭がぼやける。ところがあの香りは、重ねるほどに対極の要素が引き出された。さわやかさと重さ、明るさと暗さが、同時に立っている。森がそうであるように。"},
  {"id":"b5","type":"image","src":"/media/shop/drei-3-forest/8.jpg","alt":"","caption":"三年後、五年後へ"},
  {"id":"b6","type":"text","text":"熟成は待つことではなく、預けることに近い。三年後の自分に渡す。そのくらいの気持ちで蓋を閉める。"}]',
'[{"id":"b1","type":"title","text":"森で拾ったもの"},
  {"id":"b2","type":"text","text":"三人で森を歩いた記憶から作品をつくったとき、採集したのは香りだけではなかった。ヨーロッパトウヒ、ブナ、クロモジ。ポケットに入れて持ち帰った木片は、いまも机の上にある。"},
  {"id":"b3","type":"image","src":"/media/shop/drei-3-forest/6.jpg","alt":"","caption":""},
  {"id":"b4","type":"text","text":"五十八種類を重ねると、ふつうは輪郭がぼやける。ところがあの香りは、重ねるほどに対極の要素が引き出された。さわやかさと重さ、明るさと暗さが、同時に立っている。森がそうであるように。"},
  {"id":"b5","type":"image","src":"/media/shop/drei-3-forest/8.jpg","alt":"","caption":"三年後、五年後へ"},
  {"id":"b6","type":"text","text":"熟成は待つことではなく、預けることに近い。三年後の自分に渡す。そのくらいの気持ちで蓋を閉める。"}]',
'2026-05-30T00:00:00.000Z','2026-05-30T00:00:00.000Z'),

('pg_sumire','kaori-to-kioku','色ごとに、ちがう声','2026-04-12','/media/shop/nioisumire-2026/2.jpg','published',
'[{"id":"b1","type":"title","text":"色ごとに、ちがう声"},
  {"id":"b2","type":"text","text":"今年の菫は、色を分けて抽出してみた。白、桃、淡紫、濃紫。同じ花で、同じ畑で、同じ日に摘んでいるのに、立ちのぼるものが違う。"},
  {"id":"b3","type":"image","src":"/media/shop/nioisumire-2026/2.jpg","alt":"","caption":"静岡、春一番"},
  {"id":"b4","type":"text","text":"白は清らかに、桃はわずかに果実を帯び、淡紫は花の核へ向かい、濃紫は蜜のような甘さを持つ。分けてみて初めて、いつも「菫の香り」と呼んでいたものが、四つの声の合唱だったと分かった。"},
  {"id":"b5","type":"text","text":"一輪ずつ摘んでくださる方がいて、その手のはやさで香りが決まる。畑に立つと、調香はもう始まっている。"}]',
'[{"id":"b1","type":"title","text":"色ごとに、ちがう声"},
  {"id":"b2","type":"text","text":"今年の菫は、色を分けて抽出してみた。白、桃、淡紫、濃紫。同じ花で、同じ畑で、同じ日に摘んでいるのに、立ちのぼるものが違う。"},
  {"id":"b3","type":"image","src":"/media/shop/nioisumire-2026/2.jpg","alt":"","caption":"静岡、春一番"},
  {"id":"b4","type":"text","text":"白は清らかに、桃はわずかに果実を帯び、淡紫は花の核へ向かい、濃紫は蜜のような甘さを持つ。分けてみて初めて、いつも「菫の香り」と呼んでいたものが、四つの声の合唱だったと分かった。"},
  {"id":"b5","type":"text","text":"一輪ずつ摘んでくださる方がいて、その手のはやさで香りが決まる。畑に立つと、調香はもう始まっている。"}]',
'2026-04-12T00:00:00.000Z','2026-04-12T00:00:00.000Z'),

('pg_henshin','henshin-no-asa','下書きのままの朝','2026-07-29','/media/shop/kuromoji-tsuki-no-hibiki/2.jpg','draft',
'[{"id":"b1","type":"title","text":"下書きのままの朝"},
  {"id":"b2","type":"text","text":"（これは下書きのデモ記事です。公開ボタンを押すまで /log には表示されません。）"},
  {"id":"b3","type":"text","text":"満月の黒文字を蒸留した日のこと。水分量が満ちていて、枝を折るだけで手に香りが移った。"},
  {"id":"b4","type":"image","src":"/media/shop/kuromoji-tsuki-no-hibiki/2.jpg","alt":"","caption":"朝摘みの枝葉"}]',
'[]',
'2026-07-29T00:00:00.000Z',NULL);

-- published_* are the columns the public site actually reads (migration 0002).
UPDATE pages SET published_title = title, published_date = date, published_cover = cover
WHERE status = 'published'
  AND slug IN ('des-senteurs','shikii','asa-no-kiroku','mori-no-kioku','kaori-to-kioku');
