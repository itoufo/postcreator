import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <div className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-white shadow-sm rounded-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">プライバシーポリシー</h1>

        <div className="space-y-6 text-gray-700">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">第1条(個人情報の定義)</h2>
            <p>
              本プライバシーポリシーにおける「個人情報」とは、個人情報保護法第2条第1項に定義される、
              生存する個人に関する情報であって、当該情報に含まれる氏名、生年月日その他の記述等により
              特定の個人を識別することができるもの(他の情報と容易に照合することができ、
              それにより特定の個人を識別することができることとなるものを含む)を指します。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">第2条(個人情報の収集)</h2>
            <p>当社は、以下の個人情報を収集します。</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>メールアドレス</li>
              <li>表示名(任意)</li>
              <li>アバター画像(任意)</li>
              <li>決済情報(有料プラン利用時)</li>
              <li>利用履歴、アクセスログ、Cookie等の技術的情報</li>
              <li>SNSアカウント情報(連携時)</li>
              <li>生成したコンテンツおよびその設定情報</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">第3条(個人情報の利用目的)</h2>
            <p>当社は、収集した個人情報を以下の目的で利用します。</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>本サービスの提供、運営、維持、保護および改善のため</li>
              <li>ユーザーサポート、お問い合わせ対応のため</li>
              <li>利用規約違反の調査および対応のため</li>
              <li>本サービスに関する通知、メールマガジンの配信のため</li>
              <li>本サービスの新機能、更新情報、キャンペーン等の案内のため</li>
              <li>決済処理のため</li>
              <li>本サービスの分析、統計データの作成のため</li>
              <li>その他、上記利用目的に付随する目的のため</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">第4条(個人情報の第三者提供)</h2>
            <ol className="list-decimal list-inside space-y-2">
              <li>当社は、以下のいずれかに該当する場合を除き、ユーザーの同意なく個人情報を第三者に提供しません。
                <ul className="list-disc list-inside ml-6 mt-1">
                  <li>法令に基づく場合</li>
                  <li>人の生命、身体または財産の保護のために必要がある場合であって、本人の同意を得ることが困難である場合</li>
                  <li>公衆衛生の向上または児童の健全な育成の推進のために特に必要がある場合であって、本人の同意を得ることが困難である場合</li>
                  <li>国の機関もしくは地方公共団体またはその委託を受けた者が法令の定める事務を遂行することに対して協力する必要がある場合であって、本人の同意を得ることにより当該事務の遂行に支障を及ぼすおそれがある場合</li>
                </ul>
              </li>
              <li>当社は、本サービスの提供のため、以下の第三者サービスを利用しています。
                <ul className="list-disc list-inside ml-6 mt-1">
                  <li>Supabase(データベースおよび認証)</li>
                  <li>Stripe(決済処理)</li>
                  <li>Anthropic Claude(AI生成機能)</li>
                </ul>
              </li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">第5条(個人情報の開示・訂正・削除)</h2>
            <ol className="list-decimal list-inside space-y-2">
              <li>ユーザーは、当社が保有する自己の個人情報について、開示、訂正、削除を請求することができます。</li>
              <li>個人情報の開示、訂正、削除を希望される場合は、本サービス内の設定画面から行うか、当社お問い合わせ窓口までご連絡ください。</li>
              <li>当社は、本人確認を行った上で、合理的な期間内に対応いたします。</li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">第6条(個人情報の安全管理)</h2>
            <p>
              当社は、個人情報の漏洩、滅失またはき損の防止その他の個人情報の安全管理のため、
              必要かつ適切な措置を講じます。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">第7条(Cookie等の利用)</h2>
            <ol className="list-decimal list-inside space-y-2">
              <li>本サービスでは、利便性の向上、利用状況の分析等のため、Cookie等の技術を使用しています。</li>
              <li>ユーザーは、ブラウザの設定によりCookieを無効化することができますが、その場合、本サービスの一部機能が利用できなくなる場合があります。</li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">第8条(アクセス解析ツール)</h2>
            <p>
              本サービスでは、サービス向上のため、アクセス解析ツールを使用することがあります。
              これらのツールは、Cookieを使用してユーザーの情報を収集しますが、個人を特定する情報は収集しません。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">第9条(お問い合わせ窓口)</h2>
            <p>
              本プライバシーポリシーに関するお問い合わせは、本サービス内のお問い合わせフォームよりご連絡ください。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">第10条(プライバシーポリシーの変更)</h2>
            <p>
              当社は、法令の変更、本サービスの変更、その他必要に応じて、本プライバシーポリシーを変更することがあります。
              変更後のプライバシーポリシーは、本サービス上に表示した時点より効力を生じるものとします。
            </p>
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
