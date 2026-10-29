import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import * as fs from 'fs';

const config = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf-8'));
const app = initializeApp(config);
const db = getFirestore(app, 'ai-studio-16855e39-9011-474a-9fe1-49c4e7624a24');

async function runLiveRulesSecurityVerification() {
  console.log('=== Starting Phase 1 Live Firestore Rules Security Verification ===\n');
  const liveResults: Array<{
    id: number;
    scenario: string;
    expected: string;
    actual: string;
    status: 'PASS' | 'FAIL';
  }> = [];

  // 1. Unauthenticated read /system_settings/private_finance
  try {
    const snap = await getDoc(doc(db, 'system_settings', 'private_finance'));
    liveResults.push({
      id: 1,
      scenario: '未登入訪客讀取私密財務/銀行設定 (/system_settings/private_finance)',
      expected: 'REJECTED (permission-denied)',
      actual: `ALLOWED (doc: ${snap.exists()})`,
      status: 'FAIL',
    });
  } catch (err: any) {
    liveResults.push({
      id: 1,
      scenario: '未登入訪客讀取私密財務/銀行設定 (/system_settings/private_finance)',
      expected: 'REJECTED (permission-denied)',
      actual: `REJECTED (${err?.code})`,
      status: err?.code === 'permission-denied' ? 'PASS' : 'FAIL',
    });
  }

  // 2. Unauthenticated read /system_settings/public_config
  try {
    const snap = await getDoc(doc(db, 'system_settings', 'public_config'));
    liveResults.push({
      id: 2,
      scenario: '未登入訪客讀取前台公開賣場設定 (/system_settings/public_config)',
      expected: 'ALLOWED',
      actual: `ALLOWED (doc exists: ${snap.exists()})`,
      status: 'PASS',
    });
  } catch (err: any) {
    liveResults.push({
      id: 2,
      scenario: '未登入訪客讀取前台公開賣場設定 (/system_settings/public_config)',
      expected: 'ALLOWED',
      actual: `REJECTED (${err?.code})`,
      status: 'FAIL',
    });
  }

  // 3. Unauthenticated read /catalog/{id}/procurement/cost_data
  try {
    const snap = await getDoc(doc(db, 'catalog', 'prod_demo', 'procurement', 'cost_data'));
    liveResults.push({
      id: 3,
      scenario: '未登入訪客/顧客讀取商品批發採購成本 (/catalog/{id}/procurement/cost_data)',
      expected: 'REJECTED (permission-denied)',
      actual: `ALLOWED (doc: ${snap.exists()})`,
      status: 'FAIL',
    });
  } catch (err: any) {
    liveResults.push({
      id: 3,
      scenario: '未登入訪客/顧客讀取商品批發採購成本 (/catalog/{id}/procurement/cost_data)',
      expected: 'REJECTED (permission-denied)',
      actual: `REJECTED (${err?.code})`,
      status: err?.code === 'permission-denied' ? 'PASS' : 'FAIL',
    });
  }

  // 4. Unauthenticated read /customers
  try {
    const snap = await getDocs(collection(db, 'customers'));
    liveResults.push({
      id: 4,
      scenario: '未登入訪客讀取顧客全站名單 (/customers)',
      expected: 'REJECTED (permission-denied)',
      actual: `ALLOWED (${snap.docs.length} docs)`,
      status: 'FAIL',
    });
  } catch (err: any) {
    liveResults.push({
      id: 4,
      scenario: '未登入訪客讀取顧客全站名單 (/customers)',
      expected: 'REJECTED (permission-denied)',
      actual: `REJECTED (${err?.code})`,
      status: err?.code === 'permission-denied' ? 'PASS' : 'FAIL',
    });
  }

  // 5. Unauthenticated read /orders
  try {
    const snap = await getDocs(collection(db, 'orders'));
    liveResults.push({
      id: 5,
      scenario: '未登入訪客讀取全部訂單紀錄 (/orders)',
      expected: 'REJECTED (permission-denied)',
      actual: `ALLOWED (${snap.docs.length} docs)`,
      status: 'FAIL',
    });
  } catch (err: any) {
    liveResults.push({
      id: 5,
      scenario: '未登入訪客讀取全部訂單紀錄 (/orders)',
      expected: 'REJECTED (permission-denied)',
      actual: `REJECTED (${err?.code})`,
      status: err?.code === 'permission-denied' ? 'PASS' : 'FAIL',
    });
  }

  // 6. Unauthenticated read /payments
  try {
    const snap = await getDocs(collection(db, 'payments'));
    liveResults.push({
      id: 6,
      scenario: '未登入訪客讀取付款核銷紀錄 (/payments)',
      expected: 'REJECTED (permission-denied)',
      actual: `ALLOWED (${snap.docs.length} docs)`,
      status: 'FAIL',
    });
  } catch (err: any) {
    liveResults.push({
      id: 6,
      scenario: '未登入訪客讀取付款核銷紀錄 (/payments)',
      expected: 'REJECTED (permission-denied)',
      actual: `REJECTED (${err?.code})`,
      status: err?.code === 'permission-denied' ? 'PASS' : 'FAIL',
    });
  }

  // 7. Unauthenticated read /wishes
  try {
    const snap = await getDocs(collection(db, 'wishes'));
    liveResults.push({
      id: 7,
      scenario: '未登入訪客讀取許願單紀錄 (/wishes)',
      expected: 'REJECTED (permission-denied)',
      actual: `ALLOWED (${snap.docs.length} docs)`,
      status: 'FAIL',
    });
  } catch (err: any) {
    liveResults.push({
      id: 7,
      scenario: '未登入訪客讀取許願單紀錄 (/wishes)',
      expected: 'REJECTED (permission-denied)',
      actual: `REJECTED (${err?.code})`,
      status: err?.code === 'permission-denied' ? 'PASS' : 'FAIL',
    });
  }

  // 8. Unauthenticated read /staff_users
  try {
    const snap = await getDocs(collection(db, 'staff_users'));
    liveResults.push({
      id: 8,
      scenario: '未登入訪客讀取員工帳號列表 (/staff_users)',
      expected: 'REJECTED (permission-denied)',
      actual: `ALLOWED (${snap.docs.length} docs)`,
      status: 'FAIL',
    });
  } catch (err: any) {
    liveResults.push({
      id: 8,
      scenario: '未登入訪客讀取員工帳號列表 (/staff_users)',
      expected: 'REJECTED (permission-denied)',
      actual: `REJECTED (${err?.code})`,
      status: err?.code === 'permission-denied' ? 'PASS' : 'FAIL',
    });
  }

  // 9. Unauthenticated write /staff_users (Privilege Escalation)
  try {
    await setDoc(doc(db, 'staff_users', 'malicious_admin'), {
      username: 'attacker',
      role: 'super_admin',
      status: 'active',
    });
    liveResults.push({
      id: 9,
      scenario: '未登入者嘗試新增/提升自己為管理員 (/staff_users)',
      expected: 'REJECTED (permission-denied)',
      actual: 'ALLOWED (Doc written)',
      status: 'FAIL',
    });
  } catch (err: any) {
    liveResults.push({
      id: 9,
      scenario: '未登入者嘗試新增/提升自己為管理員 (/staff_users)',
      expected: 'REJECTED (permission-denied)',
      actual: `REJECTED (${err?.code})`,
      status: err?.code === 'permission-denied' ? 'PASS' : 'FAIL',
    });
  }

  // 10. Unauthenticated write /orders
  try {
    await setDoc(doc(db, 'orders', 'fake_order_123'), {
      orderNo: 'FAKE-001',
      customerId: 'ghost',
      totalAmountTwd: 100,
    });
    liveResults.push({
      id: 10,
      scenario: '未登入者嘗試直接寫入假訂單 (/orders)',
      expected: 'REJECTED (permission-denied)',
      actual: 'ALLOWED (Doc written)',
      status: 'FAIL',
    });
  } catch (err: any) {
    liveResults.push({
      id: 10,
      scenario: '未登入者嘗試直接寫入假訂單 (/orders)',
      expected: 'REJECTED (permission-denied)',
      actual: `REJECTED (${err?.code})`,
      status: err?.code === 'permission-denied' ? 'PASS' : 'FAIL',
    });
  }

  // 11. Unauthenticated write /payments
  try {
    await setDoc(doc(db, 'payments', 'fake_pay_123'), {
      orderId: 'fake_order',
      customerId: 'ghost',
      status: 'verified',
    });
    liveResults.push({
      id: 11,
      scenario: '未登入者嘗試偽造已核銷付款紀錄 (/payments)',
      expected: 'REJECTED (permission-denied)',
      actual: 'ALLOWED (Doc written)',
      status: 'FAIL',
    });
  } catch (err: any) {
    liveResults.push({
      id: 11,
      scenario: '未登入者嘗試偽造已核銷付款紀錄 (/payments)',
      expected: 'REJECTED (permission-denied)',
      actual: `REJECTED (${err?.code})`,
      status: err?.code === 'permission-denied' ? 'PASS' : 'FAIL',
    });
  }

  // 12. Unauthenticated write /system_settings/public_config
  try {
    await setDoc(doc(db, 'system_settings', 'public_config'), {
      shopName: 'Defaced Site',
    });
    liveResults.push({
      id: 12,
      scenario: '未登入者竄改前台公開設定 (/system_settings/public_config)',
      expected: 'REJECTED (permission-denied)',
      actual: 'ALLOWED (Doc written)',
      status: 'FAIL',
    });
  } catch (err: any) {
    liveResults.push({
      id: 12,
      scenario: '未登入者竄改前台公開設定 (/system_settings/public_config)',
      expected: 'REJECTED (permission-denied)',
      actual: `REJECTED (${err?.code})`,
      status: err?.code === 'permission-denied' ? 'PASS' : 'FAIL',
    });
  }

  console.log('--- 實測結果彙總表 (針對雲端真實部署之 Rules) ---');
  console.table(liveResults);
  process.exit(0);
}

runLiveRulesSecurityVerification().catch(console.error);
