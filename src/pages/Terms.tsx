import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';

export default function Terms() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <div className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-white shadow-sm rounded-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">利用規約</h1>

        <div className="space-y-6 text-gray-700">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">第1条(適用)</h2>
            <p>
              本規約は、PostCreator(以下「本サービス」)の利用に関し、本サービス提供者(以下「当社」)と、
              本サービスを利用するすべてのユーザー(以下「ユーザー」)との間に適用されます。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">第2条(定義)</h2>
            <p>本規約において使用する用語の定義は、以下のとおりとします。</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>「本サービス」とは、当社が提供するSNS投稿文自動生成ツール「PostCreator」を指します。</li>
              <li>「ユーザー」とは、本サービスを利用するすべての個人または法人を指します。</li>
              <li>「コンテンツ」とは、本サービスを通じて生成、投稿、送信される文章、画像、その他の情報を指します。</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">第3条(アカウント登録)</h2>
            <ol className="list-decimal list-inside space-y-2">
              <li>本サービスの利用を希望する者は、本規約に同意の上、当社所定の方法によりアカウント登録を行うものとします。</li>
              <li>当社は、登録希望者が以下のいずれかに該当する場合、登録を拒否することがあります。
                <ul className="list-disc list-inside ml-6 mt-1">
                  <li>虚偽の情報を提供した場合</li>
                  <li>過去に本規約違反により登録を削除されたことがある場合</li>
                  <li>その他、当社が不適切と判断した場合</li>
                </ul>
              </li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">第4条(アカウント管理)</h2>
            <ol className="list-decimal list-inside space-y-2">
              <li>ユーザーは、自己の責任において、アカウント情報を管理するものとします。</li>
              <li>ユーザーは、アカウント情報を第三者に利用させ、または貸与、譲渡、売買等してはならないものとします。</li>
              <li>当社は、アカウント情報の管理不十分、使用上の過誤、第三者の使用等による損害について、一切の責任を負いません。</li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">第5条(サブスクリプション)</h2>
            <ol className="list-decimal list-inside space-y-2">
              <li>本サービスは、無料プランと有料プラン(サブスクリプション)を提供します。</li>
              <li>有料プランの料金、支払い方法、決済時期等は、本サービス内で別途定めます。</li>
              <li>ユーザーは、有料プランの利用料金を、当社が指定する方法により支払うものとします。</li>
              <li>一度支払われた利用料金は、理由の如何を問わず返金されないものとします。ただし、法令上返金が必要な場合はこの限りではありません。</li>
              <li>サブスクリプションの解約は、ユーザーがいつでも行うことができます。解約後も、当該課金期間の終了日まで有料プランの機能を利用できます。</li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">第6条(禁止事項)</h2>
            <p>ユーザーは、本サービスの利用にあたり、以下の行為を行ってはならないものとします。</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>法令または公序良俗に違反する行為</li>
              <li>犯罪行為に関連する行為</li>
              <li>当社、他のユーザー、または第三者の知的財産権、肖像権、プライバシー、名誉その他の権利または利益を侵害する行為</li>
              <li>本サービスのネットワークまたはシステムに過度な負荷をかける行為</li>
              <li>本サービスの運営を妨害するおそれのある行為</li>
              <li>当社のネットワークまたはシステムに不正にアクセスする行為</li>
              <li>第三者に成りすます行為</li>
              <li>本サービスの他のユーザーのアカウントを利用する行為</li>
              <li>反社会的勢力に対する利益供与その他の協力行為</li>
              <li>その他、当社が不適切と判断する行為</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">第7条(本サービスの停止等)</h2>
            <p>
              当社は、以下のいずれかに該当する場合、ユーザーに事前に通知することなく、
              本サービスの全部または一部の提供を停止または中断することができるものとします。
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>本サービスに係るコンピュータシステムの点検または保守作業を行う場合</li>
              <li>コンピューター、通信回線等が事故により停止した場合</li>
              <li>地震、落雷、火災、風水害、停電、天災地変などの不可抗力により本サービスの運営ができなくなった場合</li>
              <li>その他、当社が停止または中断を必要と判断した場合</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">第8条(権利帰属)</h2>
            <ol className="list-decimal list-inside space-y-2">
              <li>本サービスに関する知的財産権は、すべて当社または当社にライセンスを許諾している者に帰属します。</li>
              <li>ユーザーが本サービスを通じて生成したコンテンツの著作権は、ユーザーに帰属します。</li>
              <li>ユーザーは、当社に対し、本サービスの改善、品質向上等の目的で、生成されたコンテンツを利用する非独占的な権利を無償で許諾するものとします。</li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">第9条(免責事項)</h2>
            <ol className="list-decimal list-inside space-y-2">
              <li>当社は、本サービスの内容、および本サービスを通じて生成されるコンテンツについて、その完全性、正確性、有用性等いかなる保証も行いません。</li>
              <li>当社は、本サービスの利用によりユーザーに生じた損害について、一切の責任を負いません。ただし、当社の故意または重過失による場合はこの限りではありません。</li>
              <li>ユーザーが生成したコンテンツを使用した結果生じた損害について、当社は一切の責任を負いません。</li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">第10条(規約の変更)</h2>
            <p>
              当社は、ユーザーの事前の承諾を得ることなく、本規約を変更することができるものとします。
              変更後の規約は、当社が別途定める場合を除き、本サービス上に表示した時点より効力を生じるものとします。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">第11条(準拠法・管轄裁判所)</h2>
            <ol className="list-decimal list-inside space-y-2">
              <li>本規約の解釈にあたっては、日本法を準拠法とします。</li>
              <li>本サービスに関して紛争が生じた場合には、当社の本店所在地を管轄する裁判所を専属的合意管轄裁判所とします。</li>
            </ol>
          </section>

          <section className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">制定日: 2025年1月27日</p>
            <p className="text-sm text-gray-500">最終更新日: 2025年1月30日</p>
          </section>
        </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
