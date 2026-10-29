import React, { useState, useMemo } from 'react';
import { Customer, Order } from '../../types';
import { formatTwd, formatDateTime } from '../../utils/format';
import { exportCustomersToExcel } from '../../utils/excelExport';
import {
  Users,
  Search,
  Plus,
  UserCheck,
  ShoppingBag,
  MapPin,
  Phone,
  MessageCircle,
  X,
  Edit2,
  FileSpreadsheet,
  Key,
  ArrowUpDown,
  Hash,
  Package,
} from 'lucide-react';

interface CustomersViewProps {
  customers: Customer[];
  orders: Order[];
  onSaveCustomer: (customer: Customer) => void;
  onSelectOrder: (order: Order) => void;
  onNavigateToOrders: () => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  customers,
  orders,
  onSaveCustomer,
  onSelectOrder,
  onNavigateToOrders,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCustomerDetail, setActiveCustomerDetail] = useState<Customer | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState<
    'customerCode-asc' | 'customerCode-desc' | 'totalSpent-desc' | 'ordersCount-desc' | 'createdAt-desc'
  >('customerCode-asc');

  // Form states for create/edit
  const [formCustomerCode, setFormCustomerCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formCommunityName, setFormCommunityName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formLine, setFormLine] = useState('');
  const [formIg, setFormIg] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formTag, setFormTag] = useState<'VIP' | '常客' | '新客'>('常客');
  const [formDeliveryType, setFormDeliveryType] = useState<'7-11' | 'family' | 'home'>('7-11');
  const [formStoreCode, setFormStoreCode] = useState('');
  const [formStoreName, setFormStoreName] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formNotes, setFormNotes] = useState('');

  const getCustomerOrders = (customerId: string) => {
    return orders.filter((o) => o.customerId === customerId);
  };

  const openEditModal = (cust: Customer) => {
    setEditingCustomer(cust);
    setFormCustomerCode(cust.customerCode || '');
    setFormName(cust.name);
    setFormCommunityName(cust.communityName || '');
    setFormPhone(cust.phone);
    setFormLine(cust.lineId);
    setFormIg(cust.igHandle || '');
    setFormPassword(cust.password || 'password123');
    setFormTag(cust.tag);
    setFormDeliveryType(cust.delivery.type);
    setFormStoreCode(cust.delivery.storeCode || '');
    setFormStoreName(cust.delivery.storeName || '');
    setFormAddress(cust.delivery.address || '');
    setFormNotes(cust.notes || '');
  };

  const openCreateModal = () => {
    setEditingCustomer(null);
    const maxNum = customers.reduce((max, c) => {
      const m = (c.customerCode || '').match(/\d+/);
      return m ? Math.max(max, parseInt(m[0], 10)) : max;
    }, customers.length);
    setFormCustomerCode(`CUST-${String(maxNum + 1).padStart(3, '0')}`);
    setFormName('');
    setFormCommunityName('');
    setFormPhone('');
    setFormLine('');
    setFormIg('');
    setFormPassword('password123');
    setFormTag('新客');
    setFormDeliveryType('7-11');
    setFormStoreCode('');
    setFormStoreName('');
    setFormAddress('');
    setFormNotes('');
    setIsNewModalOpen(true);
  };

  const handleSave = () => {
    if (!formName.trim()) {
      alert('請填寫客戶姓名');
      return;
    }

    const defaultCode = `CUST-${String(customers.length + 1).padStart(3, '0')}`;
    const newCust: Customer = {
      id: editingCustomer ? editingCustomer.id : `cust-${Date.now()}`,
      customerCode: formCustomerCode.trim() || editingCustomer?.customerCode || defaultCode,
      name: formName,
      communityName: formCommunityName.trim() || undefined,
      phone: formPhone,
      lineId: formLine,
      igHandle: formIg,
      password: formPassword.trim() || editingCustomer?.password || 'password123',
      tag: formTag,
      delivery: {
        type: formDeliveryType,
        storeCode: formStoreCode,
        storeName: formStoreName,
        address: formAddress,
      },
      notes: formNotes,
      totalSpentTwd: editingCustomer ? editingCustomer.totalSpentTwd : 0,
      ordersCount: editingCustomer ? editingCustomer.ordersCount : 0,
      createdAt: editingCustomer ? editingCustomer.createdAt : new Date().toISOString(),
    };

    onSaveCustomer(newCust);
    setEditingCustomer(null);
    setIsNewModalOpen(false);
  };

  const sortedAndFilteredCustomers = useMemo(() => {
    const list = customers.filter((c) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        (c.customerCode && c.customerCode.toLowerCase().includes(q)) ||
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.lineId.toLowerCase().includes(q) ||
        (c.igHandle && c.igHandle.toLowerCase().includes(q))
      );
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'customerCode-asc') {
        return (a.customerCode || '').localeCompare(b.customerCode || '', undefined, {
          numeric: true,
          sensitivity: 'base',
        });
      }
      if (sortBy === 'customerCode-desc') {
        return (b.customerCode || '').localeCompare(a.customerCode || '', undefined, {
          numeric: true,
          sensitivity: 'base',
        });
      }
      if (sortBy === 'totalSpent-desc') {
        const spentA = Math.max(
          a.totalSpentTwd,
          getCustomerOrders(a.id).reduce((sum, o) => sum + (o.depositPaidTwd + o.balancePaidTwd), 0)
        );
        const spentB = Math.max(
          b.totalSpentTwd,
          getCustomerOrders(b.id).reduce((sum, o) => sum + (o.depositPaidTwd + o.balancePaidTwd), 0)
        );
        return spentB - spentA;
      }
      if (sortBy === 'ordersCount-desc') {
        const countA = Math.max(a.ordersCount, getCustomerOrders(a.id).length);
        const countB = Math.max(b.ordersCount, getCustomerOrders(b.id).length);
        return countB - countA;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [customers, searchQuery, sortBy, orders]);

  return (
    <div className="space-y-4">
      {/* Top Header & Search & Sort */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-xl">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜尋客戶編號 (如 CUST-001)、姓名、電話、LINE ID、IG..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
            />
          </div>

          {/* Sort Selector */}
          <div className="relative shrink-0 flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-500 text-[11px] whitespace-nowrap">排序：</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="customerCode-asc">客戶編號 (升冪 A ➔ Z)</option>
              <option value="customerCode-desc">客戶編號 (降冪 Z ➔ A)</option>
              <option value="totalSpent-desc">累計消費金額 (高 ➔ 低)</option>
              <option value="ordersCount-desc">委託訂單數 (多 ➔ 少)</option>
              <option value="createdAt-desc">建立時間 (新 ➔ 舊)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => exportCustomersToExcel(sortedAndFilteredCustomers)}
            title="匯出客戶清單為 Excel 檔案 (.xlsx)"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 hover:text-emerald-800 transition-colors shadow-2xs cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>匯出 Excel 名冊</span>
          </button>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>新增客戶資料</span>
          </button>
        </div>
      </div>

      {/* Customer Grid / Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-medium">
                <th className="py-3 px-4">客戶編號</th>
                <th className="py-3 px-4">客戶姓名 / 分級</th>
                <th className="py-3 px-4">通訊軟體 (LINE / IG)</th>
                <th className="py-3 px-4">聯絡電話</th>
                <th className="py-3 px-4">常用取件超商 / 地址</th>
                <th className="py-3 px-4 text-right">累計消費金額</th>
                <th className="py-3 px-4 text-center">委託單數</th>
                <th className="py-3 px-4 text-center">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedAndFilteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    查無符合條件的客戶資料
                  </td>
                </tr>
              ) : (
                sortedAndFilteredCustomers.map((cust) => {
                  const tagStyles: Record<string, string> = {
                    VIP: 'bg-amber-100 text-amber-800 font-semibold',
                    常客: 'bg-blue-100 text-blue-800',
                    新客: 'bg-emerald-100 text-emerald-800',
                  };

                  const custOrders = getCustomerOrders(cust.id);
                  const calculatedSpent = custOrders.reduce(
                    (sum, o) => sum + (o.depositPaidTwd + o.balancePaidTwd),
                    0
                  );
                  const arrivedCount = custOrders.filter(
                    (o) => o.status === 'arrived_tw' || o.status === 'pending_balance'
                  ).length;

                  return (
                    <tr key={cust.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 shadow-2xs">
                          {cust.customerCode || 'CUST-000'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-slate-900">{cust.name}</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded ${
                              tagStyles[cust.tag] || 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {cust.tag}
                          </span>
                          {cust.communityName && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                              💬 {cust.communityName}
                            </span>
                          )}
                          {arrivedCount >= 2 && (
                            <span
                              title={`此客戶有 ${arrivedCount} 筆訂單抵台，可合併出貨`}
                              className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-indigo-100 text-indigo-700 border border-indigo-200 flex items-center gap-0.5"
                            >
                              <Package className="w-2.5 h-2.5" />
                              <span>可併出貨({arrivedCount})</span>
                            </span>
                          )}
                        </div>
                        {cust.notes && (
                          <div className="text-[11px] text-slate-600 truncate max-w-xs mt-0.5">
                            {cust.notes}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-slate-800 font-mono">LINE: {cust.lineId}</div>
                        {cust.igHandle && (
                          <div className="text-[11px] text-slate-600 font-mono">{cust.igHandle}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700">{cust.phone}</td>
                      <td className="py-3 px-4 text-slate-700 max-w-xs">
                        <div className="font-medium">
                          {cust.delivery.type === 'home'
                            ? '宅配到府'
                            : `${cust.delivery.type === '7-11' ? '7-11' : '全家'} 取件`}
                        </div>
                        <div className="text-[11px] text-slate-600 truncate">
                          {cust.delivery.storeName || cust.delivery.address}
                          {cust.delivery.storeCode && ` (${cust.delivery.storeCode})`}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900">
                        {formatTwd(Math.max(cust.totalSpentTwd, calculatedSpent))}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-slate-700">
                        {Math.max(cust.ordersCount, custOrders.length)} 單
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setActiveCustomerDetail(cust)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
                          >
                            歷史訂單
                          </button>
                          <span className="text-slate-300">·</span>
                          <button
                            onClick={() => openEditModal(cust)}
                            className="text-xs text-slate-600 hover:text-slate-900 font-medium cursor-pointer"
                          >
                            編輯
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Detail Drawer with Order History */}
      {activeCustomerDetail && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-200 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <UserCheck className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-200">
                      {activeCustomerDetail.customerCode || 'CUST-000'}
                    </span>
                    <h3 className="text-base font-bold text-slate-900">
                      {activeCustomerDetail.name} 的委託紀錄
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 flex items-center gap-2 flex-wrap mt-1">
                    <span>LINE: {activeCustomerDetail.lineId}</span>
                    <span>·</span>
                    <span>電話: {activeCustomerDetail.phone}</span>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1 text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      <Key className="w-3 h-3 text-blue-600" />
                      <span>前台登入密碼：</span>
                      <strong className="font-mono">{activeCustomerDetail.password || 'password123'}</strong>
                    </span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveCustomerDetail(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Arrived merge banner if multiple orders arrived in TW */}
            {(() => {
              const arrived = getCustomerOrders(activeCustomerDetail.id).filter(
                (o) => o.status === 'arrived_tw' || o.status === 'pending_balance'
              );
              if (arrived.length >= 2) {
                return (
                  <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-indigo-950 text-xs">
                      <Package className="w-4 h-4 text-indigo-600 shrink-0" />
                      <div>
                        <div className="font-bold">
                          此客戶共有 {arrived.length} 筆訂單已抵台待發貨！
                        </div>
                        <div className="text-[11px] text-indigo-700">
                          可於「訂單管理」一鍵打勾合併訂單並指派同一個寄件單號，節省超取運費。
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setActiveCustomerDetail(null);
                        onNavigateToOrders();
                      }}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold cursor-pointer whitespace-nowrap shadow-2xs"
                    >
                      前往合併出貨 ➔
                    </button>
                  </div>
                );
              }
              return null;
            })()}

            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-slate-700">歷史委託訂單清單：</h4>
              {getCustomerOrders(activeCustomerDetail.id).length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">目前尚無代購訂單</div>
              ) : (
                <div className="space-y-2">
                  {getCustomerOrders(activeCustomerDetail.id).map((ord) => (
                    <div
                      key={ord.id}
                      className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900">{ord.orderNo}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-slate-200 text-slate-700">
                            {ord.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {formatDateTime(ord.createdAt)} · 國別: {ord.country} · {ord.items.length} 件商品
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-slate-900">
                          {formatTwd(ord.itemsTotalTwd)}
                        </div>
                        <button
                          onClick={() => {
                            onSelectOrder(ord);
                            setActiveCustomerDetail(null);
                            onNavigateToOrders();
                          }}
                          className="text-[11px] text-blue-600 hover:underline cursor-pointer"
                        >
                          前往訂單處理 ➔
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {(isNewModalOpen || editingCustomer) && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingCustomer ? '編輯客戶資料' : '新增客戶資料'}
              </h3>
              <button
                onClick={() => {
                  setEditingCustomer(null);
                  setIsNewModalOpen(false);
                }}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Customer Code Setting */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-slate-800 font-bold text-xs flex items-center gap-1">
                    <Hash className="w-3.5 h-3.5 text-blue-600" />
                    <span>客戶編號 *</span>
                  </label>
                  <span className="text-[11px] text-slate-400">可自訂，支援依編號升冪/降冪排序</span>
                </div>
                <input
                  type="text"
                  required
                  value={formCustomerCode}
                  onChange={(e) => setFormCustomerCode(e.target.value)}
                  placeholder="例：CUST-001 或 VIP-888"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono font-bold text-blue-900 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">客戶姓名 *</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="例：張雅婷"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">會員等級</label>
                  <select
                    value={formTag}
                    onChange={(e) => setFormTag(e.target.value as any)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                  >
                    <option value="新客">新客</option>
                    <option value="常客">常客</option>
                    <option value="VIP">VIP</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">聯絡電話</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="例：0912-345-678"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">LINE 帳號</label>
                  <input
                    type="text"
                    value={formLine}
                    onChange={(e) => setFormLine(e.target.value)}
                    placeholder="例：yating_line"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">社群/社團顯示暱稱 (選填)</label>
                <input
                  type="text"
                  value={formCommunityName}
                  onChange={(e) => setFormCommunityName(e.target.value)}
                  placeholder="例：雅婷-台北VIP連線群"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">IG 帳號 (選填)</label>
                <input
                  type="text"
                  value={formIg}
                  onChange={(e) => setFormIg(e.target.value)}
                  placeholder="例：@yating.daily"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="p-3 bg-blue-50/60 border border-blue-200/80 rounded-xl space-y-1.5">
                <label className="block text-blue-950 font-bold text-xs flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-blue-600" />
                  <span>客戶前台登入密碼 *</span>
                  <span className="text-[10px] font-normal text-blue-700 bg-blue-100 px-1.5 py-0.2 rounded-full">
                    前台登入查單使用
                  </span>
                </label>
                <input
                  type="text"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder="請輸入密碼 (預設: password123)"
                  className="w-full px-3 py-1.5 bg-white border border-blue-200 rounded-lg text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <p className="text-[10px] text-blue-700/80">
                  客戶在前台「訂單進度查詢」或「會員中心」輸入手機與此密碼，即可隨時查閱其所有委託訂單。
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <label className="block text-slate-700 font-medium mb-1">常用取件方式</label>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {(['7-11', 'family', 'home'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setFormDeliveryType(t)}
                      className={`py-1.5 rounded-lg border text-xs font-medium ${
                        formDeliveryType === t
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      {t === '7-11' ? '7-11 超商' : t === 'family' ? '全家便利商店' : '黑貓宅配到府'}
                    </button>
                  ))}
                </div>

                {formDeliveryType !== 'home' ? (
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={formStoreCode}
                      onChange={(e) => setFormStoreCode(e.target.value)}
                      placeholder="門市店號 (例：991280)"
                      className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                    />
                    <input
                      type="text"
                      value={formStoreName}
                      onChange={(e) => setFormStoreName(e.target.value)}
                      placeholder="門市名稱 (例：敦化門市)"
                      className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                ) : (
                  <input
                    type="text"
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    placeholder="完整收件地址"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                  />
                )}
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">客戶備註</label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="例：偏好日系無印、防撞包裝特別提醒"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditingCustomer(null);
                  setIsNewModalOpen(false);
                }}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
              >
                儲存客戶資料
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
