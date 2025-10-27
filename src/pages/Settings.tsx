import Layout from '@/components/common/Layout';
import SNSConnections from '@/components/settings/SNSConnections';

export default function Settings() {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">設定</h2>
          <p className="mt-1 text-sm text-gray-600">
            アカウント設定とSNS連携を管理
          </p>
        </div>

        <SNSConnections />
      </div>
    </Layout>
  );
}
