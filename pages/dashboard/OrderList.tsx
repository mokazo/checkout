import React, { useState, useEffect } from 'react';
import { Order, PaymentStatus } from '../../types';
import { mockApi } from '../../services/mockApi';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-md p-2 shadow-lg">
        <p className="label text-sm text-gray-400">{`${label}`}</p>
        <p className="intro text-white font-bold">{`€${payload[0].value.toFixed(2)}`}</p>
      </div>
    );
  }
  return null;
};

export const OrderList: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    mockApi.getOrders().then(setOrders);
  }, []);

  // Simple stats for the chart
  const data = orders.reduce((acc: any[], order) => {
    const date = new Date(order.createdAt).toLocaleDateString();
    const existing = acc.find(item => item.date === date);
    if (existing) {
      existing.amount += order.totalAmount;
    } else {
      acc.push({ date, amount: order.totalAmount });
    }
    return acc;
  }, []).slice(-7); // Last 7 days

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
          <p className="text-sm text-gray-400">Total Revenue</p>
          <p className="text-2xl font-bold text-white">
            €{orders.reduce((acc, o) => acc + o.totalAmount, 0).toFixed(2)}
          </p>
        </div>
        <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
          <p className="text-sm text-gray-400">Total Orders</p>
          <p className="text-2xl font-bold text-white">{orders.length}</p>
        </div>
        <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
          <p className="text-sm text-gray-400">Avg. Order Value</p>
          <p className="text-2xl font-bold text-white">
            €{orders.length > 0 ? (orders.reduce((acc, o) => acc + o.totalAmount, 0) / orders.length).toFixed(2) : '0.00'}
          </p>
        </div>
      </div>

      <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
        <h3 className="text-lg font-semibold text-white mb-4">Revenue Trend</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} stroke="#6b7280" />
              <YAxis fontSize={12} tickLine={false} axisLine={false} stroke="#6b7280" tickFormatter={(value) => `€${value}`} />
              <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(107, 114, 128, 0.1)'}} />
              <Bar dataKey="amount" fill="#f97316" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h3 className="text-lg font-semibold text-white">Recent Orders</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-950 text-gray-400 font-medium">
              <tr>
                <th className="px-6 py-3">Order ID</th>
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3">Product</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {orders.map(order => (
                <tr key={order.id} className="hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4 font-mono text-gray-500">{order.orderNumber}</td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-white">{order.customerName}</div>
                    <div className="text-xs text-gray-400">{order.customerEmail}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-300">{order.productName || 'Custom Payment'}</td>
                  <td className="px-6 py-4 text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      order.paymentStatus === PaymentStatus.PAID ? 'bg-green-500/10 text-green-400' :
                      order.paymentStatus === PaymentStatus.PENDING ? 'bg-yellow-500/10 text-yellow-400' :
                      'bg-red-500/10 text-red-400'
                    }`}>
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-white">€{order.totalAmount.toFixed(2)}</td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">No orders yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};