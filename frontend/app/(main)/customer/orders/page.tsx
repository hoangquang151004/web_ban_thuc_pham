/* eslint-disable @next/next/no-img-element */
'use client';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { Timeline } from 'primereact/timeline';
import { Card } from 'primereact/card';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { ProgressSpinner } from 'primereact/progressspinner';
import { TabView, TabPanel } from 'primereact/tabview';
import { Badge } from 'primereact/badge';
import { Divider } from 'primereact/divider';
import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { orderAPI } from '@/services/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

interface OrderItem {
    id: number;
    product: number;
    product_name: string;
    product_price: number;
    quantity: number;
    subtotal: number;
}

interface Order {
    id: number;
    order_number: string;
    user: number | null;
    full_name: string;
    phone: string;
    email: string;
    address: string;
    district: string;
    city: string;
    note: string;
    subtotal: number;
    shipping_fee: number;
    total: number;
    status: 'pending' | 'confirmed' | 'processing' | 'shipping' | 'delivered' | 'cancelled' | 'returned';
    status_display: string;
    payment_method: 'cod' | 'vnpay' | 'momo' | 'banking';
    payment_method_display: string;
    payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
    payment_status_display: string;
    items: OrderItem[];
    created_at: string;
    updated_at: string;
    confirmed_at: string | null;
    delivered_at: string | null;
}

const OrdersPage = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [detailDialog, setDetailDialog] = useState(false);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(0);
    const toast = useRef<Toast>(null);

    // Fetch orders from API
    useEffect(() => {
        fetchOrders();
    }, []);

    // Filter orders when tab changes
    useEffect(() => {
        filterOrders(activeTab);
    }, [activeTab, orders]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const data = await orderAPI.getAll();
            console.log('Orders API Response:', data);
            // API có thể trả về array trực tiếp hoặc object với results
            const ordersList = Array.isArray(data) ? data : data.results || [];
            console.log('Orders List:', ordersList);
            setOrders(ordersList);
        } catch (error: any) {
            console.error('Error fetching orders:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Lỗi',
                detail: error.message || 'Không thể tải danh sách đơn hàng',
                life: 3000
            });
        } finally {
            setLoading(false);
        }
    };

    const filterOrders = (tabIndex: number) => {
        // Đảm bảo orders là array
        if (!Array.isArray(orders)) {
            setFilteredOrders([]);
            return;
        }

        let filtered = [...orders];

        switch (tabIndex) {
            case 0: // Tất cả
                break;
            case 1: // Chờ xác nhận
                filtered = orders.filter((o) => o.status === 'pending');
                break;
            case 2: // Đang xử lý
                filtered = orders.filter((o) => o.status === 'confirmed' || o.status === 'processing');
                break;
            case 3: // Đang giao
                filtered = orders.filter((o) => o.status === 'shipping');
                break;
            case 4: // Đã giao
                filtered = orders.filter((o) => o.status === 'delivered');
                break;
            case 5: // Đã hủy
                filtered = orders.filter((o) => o.status === 'cancelled' || o.status === 'returned');
                break;
            default:
                break;
        }

        setFilteredOrders(filtered);
    };

    const getOrderCountByStatus = (status: string[]) => {
        if (!Array.isArray(orders)) return 0;
        return orders.filter((o) => status.includes(o.status)).length;
    };

    const statusMap: { [key: string]: { label: string; severity: any } } = {
        pending: { label: 'Chờ xác nhận', severity: 'warning' },
        confirmed: { label: 'Đã xác nhận', severity: 'info' },
        processing: { label: 'Đang xử lý', severity: 'info' },
        shipping: { label: 'Đang giao', severity: 'primary' },
        delivered: { label: 'Đã giao', severity: 'success' },
        cancelled: { label: 'Đã hủy', severity: 'danger' },
        returned: { label: 'Đã hoàn', severity: 'secondary' }
    };

    const statusBodyTemplate = (rowData: Order) => {
        const status = statusMap[rowData.status];
        return <Tag value={status?.label || rowData.status_display} severity={status?.severity || 'info'} />;
    };

    const dateBodyTemplate = (rowData: Order) => {
        return new Date(rowData.created_at).toLocaleDateString('vi-VN');
    };

    const totalBodyTemplate = (rowData: Order) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(rowData.total);
    };

    const actionBodyTemplate = (rowData: Order) => {
        return (
            <div className="flex gap-2">
                <Button icon="pi pi-eye" rounded outlined onClick={() => viewOrderDetail(rowData)} tooltip="Xem chi tiết" />
                {(rowData.status === 'pending' || rowData.status === 'confirmed') && <Button icon="pi pi-times" rounded outlined severity="danger" onClick={() => cancelOrder(rowData)} tooltip="Hủy đơn" />}
            </div>
        );
    };

    const viewOrderDetail = (order: Order) => {
        setSelectedOrder(order);
        setDetailDialog(true);
    };

    const cancelOrder = async (order: Order) => {
        confirmDialog({
            message: `Bạn có chắc chắn muốn hủy đơn hàng ${order.order_number}?`,
            header: 'Xác nhận hủy đơn',
            icon: 'pi pi-exclamation-triangle',
            accept: async () => {
                try {
                    await orderAPI.cancel(order.id);

                    toast.current?.show({
                        severity: 'success',
                        summary: 'Đã hủy',
                        detail: 'Đơn hàng đã được hủy thành công',
                        life: 3000
                    });

                    // Reload orders
                    fetchOrders();
                } catch (error: any) {
                    toast.current?.show({
                        severity: 'error',
                        summary: 'Lỗi',
                        detail: error.message || 'Không thể hủy đơn hàng',
                        life: 3000
                    });
                }
            },
            acceptLabel: 'Có',
            rejectLabel: 'Không'
        });
    };

    // Get timeline events for order
    const getOrderTimeline = (order: Order) => {
        const events = [];

        // Pending
        events.push({
            status: 'Đặt hàng',
            date: new Date(order.created_at).toLocaleString('vi-VN'),
            icon: 'pi pi-shopping-cart',
            color: '#9C27B0'
        });

        // Confirmed
        if (order.confirmed_at || ['confirmed', 'processing', 'shipping', 'delivered'].includes(order.status)) {
            events.push({
                status: 'Đã xác nhận',
                date: order.confirmed_at ? new Date(order.confirmed_at).toLocaleString('vi-VN') : 'Đang chờ',
                icon: 'pi pi-check-circle',
                color: '#607D8B'
            });
        }

        // Processing
        if (['processing', 'shipping', 'delivered'].includes(order.status)) {
            events.push({
                status: 'Đang xử lý',
                date: 'Đang xử lý',
                icon: 'pi pi-cog',
                color: '#FF9800'
            });
        }

        // Shipping
        if (['shipping', 'delivered'].includes(order.status)) {
            events.push({
                status: 'Đang giao hàng',
                date: 'Đang vận chuyển',
                icon: 'pi pi-truck',
                color: '#2196F3'
            });
        }

        // Delivered
        if (order.delivered_at || order.status === 'delivered') {
            events.push({
                status: 'Đã giao hàng',
                date: order.delivered_at ? new Date(order.delivered_at).toLocaleString('vi-VN') : 'Đã hoàn thành',
                icon: 'pi pi-check',
                color: '#4CAF50'
            });
        }

        // Cancelled
        if (order.status === 'cancelled') {
            events.push({
                status: 'Đã hủy',
                date: new Date(order.updated_at).toLocaleString('vi-VN'),
                icon: 'pi pi-times-circle',
                color: '#f44336'
            });
        }

        // Returned
        if (order.status === 'returned') {
            events.push({
                status: 'Đã hoàn trả',
                date: new Date(order.updated_at).toLocaleString('vi-VN'),
                icon: 'pi pi-replay',
                color: '#795548'
            });
        }

        return events;
    };

    // Loading state
    if (loading) {
        return (
            <div className="grid">
                <div className="col-12">
                    <div className="card">
                        <div className="text-center py-8">
                            <ProgressSpinner />
                            <p className="mt-4">Đang tải danh sách đơn hàng...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Empty state
    if (!loading && orders.length === 0) {
        return (
            <div className="grid">
                <Toast ref={toast} />
                <div className="col-12">
                    <div className="card">
                        <div className="text-center py-8">
                            <i className="pi pi-shopping-bag text-6xl text-400 mb-4"></i>
                            <h3 className="text-600">Bạn chưa có đơn hàng nào</h3>
                            <p className="text-500 mb-4">Hãy mua sắm và đặt hàng ngay!</p>
                            <Link href="/customer/products">
                                <Button label="Mua sắm ngay" icon="pi pi-shopping-bag" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="grid">
            <Toast ref={toast} />
            <ConfirmDialog />

            <div className="col-12">
                <div className="card">
                    <div className="flex justify-content-between align-items-center mb-4">
                        <h5 className="m-0">Đơn Hàng Của Tôi</h5>
                        <Link href="/customer/products">
                            <Button label="Tiếp tục mua sắm" icon="pi pi-shopping-bag" size="small" />
                        </Link>
                    </div>

                    <TabView activeIndex={activeTab} onTabChange={(e) => setActiveTab(e.index)}>
                        <TabPanel
                            header={
                                <div className="flex align-items-center gap-2">
                                    <span>Tất cả</span>
                                    <Badge value={orders.length} />
                                </div>
                            }
                        >
                            <DataTable value={filteredOrders} paginator rows={10} dataKey="id" emptyMessage="Bạn chưa có đơn hàng nào" className="p-datatable-sm">
                                <Column field="order_number" header="Mã đơn hàng" sortable style={{ minWidth: '150px' }} />
                                <Column header="Ngày đặt" body={dateBodyTemplate} sortable field="created_at" style={{ minWidth: '120px' }} />
                                <Column header="Trạng thái" body={statusBodyTemplate} sortable field="status" style={{ minWidth: '150px' }} />
                                <Column field="payment_method_display" header="Thanh toán" style={{ minWidth: '120px' }} />
                                <Column header="Tổng tiền" body={totalBodyTemplate} sortable field="total" style={{ minWidth: '150px' }} />
                                <Column body={actionBodyTemplate} exportable={false} style={{ minWidth: '150px' }} />
                            </DataTable>
                        </TabPanel>

                        <TabPanel
                            header={
                                <div className="flex align-items-center gap-2">
                                    <span>Chờ xác nhận</span>
                                    <Badge value={getOrderCountByStatus(['pending'])} severity="warning" />
                                </div>
                            }
                        >
                            <DataTable value={filteredOrders} paginator rows={10} dataKey="id" emptyMessage="Không có đơn hàng nào" className="p-datatable-sm">
                                <Column field="order_number" header="Mã đơn hàng" sortable style={{ minWidth: '150px' }} />
                                <Column header="Ngày đặt" body={dateBodyTemplate} sortable field="created_at" style={{ minWidth: '120px' }} />
                                <Column field="payment_method_display" header="Thanh toán" style={{ minWidth: '120px' }} />
                                <Column header="Tổng tiền" body={totalBodyTemplate} sortable field="total" style={{ minWidth: '150px' }} />
                                <Column body={actionBodyTemplate} exportable={false} style={{ minWidth: '150px' }} />
                            </DataTable>
                        </TabPanel>

                        <TabPanel
                            header={
                                <div className="flex align-items-center gap-2">
                                    <span>Đang xử lý</span>
                                    <Badge value={getOrderCountByStatus(['confirmed', 'processing'])} severity="info" />
                                </div>
                            }
                        >
                            <DataTable value={filteredOrders} paginator rows={10} dataKey="id" emptyMessage="Không có đơn hàng nào" className="p-datatable-sm">
                                <Column field="order_number" header="Mã đơn hàng" sortable style={{ minWidth: '150px' }} />
                                <Column header="Ngày đặt" body={dateBodyTemplate} sortable field="created_at" style={{ minWidth: '120px' }} />
                                <Column field="payment_method_display" header="Thanh toán" style={{ minWidth: '120px' }} />
                                <Column header="Tổng tiền" body={totalBodyTemplate} sortable field="total" style={{ minWidth: '150px' }} />
                                <Column body={actionBodyTemplate} exportable={false} style={{ minWidth: '150px' }} />
                            </DataTable>
                        </TabPanel>

                        <TabPanel
                            header={
                                <div className="flex align-items-center gap-2">
                                    <span>Đang giao</span>
                                    <Badge value={getOrderCountByStatus(['shipping'])} />
                                </div>
                            }
                        >
                            <DataTable value={filteredOrders} paginator rows={10} dataKey="id" emptyMessage="Không có đơn hàng nào" className="p-datatable-sm">
                                <Column field="order_number" header="Mã đơn hàng" sortable style={{ minWidth: '150px' }} />
                                <Column header="Ngày đặt" body={dateBodyTemplate} sortable field="created_at" style={{ minWidth: '120px' }} />
                                <Column field="payment_method_display" header="Thanh toán" style={{ minWidth: '120px' }} />
                                <Column header="Tổng tiền" body={totalBodyTemplate} sortable field="total" style={{ minWidth: '150px' }} />
                                <Column body={actionBodyTemplate} exportable={false} style={{ minWidth: '150px' }} />
                            </DataTable>
                        </TabPanel>

                        <TabPanel
                            header={
                                <div className="flex align-items-center gap-2">
                                    <span>Đã giao</span>
                                    <Badge value={getOrderCountByStatus(['delivered'])} severity="success" />
                                </div>
                            }
                        >
                            <DataTable value={filteredOrders} paginator rows={10} dataKey="id" emptyMessage="Không có đơn hàng nào" className="p-datatable-sm">
                                <Column field="order_number" header="Mã đơn hàng" sortable style={{ minWidth: '150px' }} />
                                <Column header="Ngày đặt" body={dateBodyTemplate} sortable field="created_at" style={{ minWidth: '120px' }} />
                                <Column field="payment_method_display" header="Thanh toán" style={{ minWidth: '120px' }} />
                                <Column header="Tổng tiền" body={totalBodyTemplate} sortable field="total" style={{ minWidth: '150px' }} />
                                <Column body={actionBodyTemplate} exportable={false} style={{ minWidth: '150px' }} />
                            </DataTable>
                        </TabPanel>

                        <TabPanel
                            header={
                                <div className="flex align-items-center gap-2">
                                    <span>Đã hủy</span>
                                    <Badge value={getOrderCountByStatus(['cancelled', 'returned'])} severity="danger" />
                                </div>
                            }
                        >
                            <DataTable value={filteredOrders} paginator rows={10} dataKey="id" emptyMessage="Không có đơn hàng nào" className="p-datatable-sm">
                                <Column field="order_number" header="Mã đơn hàng" sortable style={{ minWidth: '150px' }} />
                                <Column header="Ngày đặt" body={dateBodyTemplate} sortable field="created_at" style={{ minWidth: '120px' }} />
                                <Column header="Trạng thái" body={statusBodyTemplate} sortable field="status" style={{ minWidth: '150px' }} />
                                <Column field="payment_method_display" header="Thanh toán" style={{ minWidth: '120px' }} />
                                <Column header="Tổng tiền" body={totalBodyTemplate} sortable field="total" style={{ minWidth: '150px' }} />
                                <Column body={actionBodyTemplate} exportable={false} style={{ minWidth: '150px' }} />
                            </DataTable>
                        </TabPanel>
                    </TabView>
                </div>
            </div>

            {/* Order Detail Dialog */}
            <Dialog visible={detailDialog} style={{ width: '1000px' }} header={`Chi tiết đơn hàng ${selectedOrder?.order_number}`} modal className="p-fluid" onHide={() => setDetailDialog(false)}>
                {selectedOrder && (
                    <div className="grid">
                        {/* Timeline */}
                        <div className="col-12">
                            <Card className="mb-3">
                                <h6 className="mb-3">Trạng thái đơn hàng</h6>
                                <Timeline
                                    value={getOrderTimeline(selectedOrder)}
                                    align="alternate"
                                    className="customized-timeline"
                                    marker={(item) => (
                                        <span className="flex w-2rem h-2rem align-items-center justify-content-center text-white border-circle z-1 shadow-1" style={{ backgroundColor: item.color }}>
                                            <i className={item.icon}></i>
                                        </span>
                                    )}
                                    content={(item) => (
                                        <Card className="mt-3">
                                            <div className="font-medium mb-1">{item.status}</div>
                                            <div className="text-600 text-sm">{item.date}</div>
                                        </Card>
                                    )}
                                />
                            </Card>
                        </div>

                        <div className="col-12 lg:col-7">
                            <div className="surface-0 p-4 border-round mb-3 border-1 surface-border">
                                <div className="flex justify-content-between align-items-start mb-3">
                                    <h6 className="mt-0 mb-0">Thông tin đơn hàng</h6>
                                    <Tag value={statusMap[selectedOrder.status]?.label || selectedOrder.status_display} severity={statusMap[selectedOrder.status]?.severity || 'info'} />
                                </div>
                                <Divider />
                                <div className="grid">
                                    <div className="col-12">
                                        <div className="mb-3">
                                            <div className="text-600 mb-1">
                                                <i className="pi pi-hashtag mr-2"></i>Mã đơn hàng
                                            </div>
                                            <div className="font-bold">{selectedOrder.order_number}</div>
                                        </div>
                                        <div className="mb-3">
                                            <div className="text-600 mb-1">
                                                <i className="pi pi-calendar mr-2"></i>Ngày đặt
                                            </div>
                                            <div>{new Date(selectedOrder.created_at).toLocaleString('vi-VN')}</div>
                                        </div>
                                        <div className="mb-3">
                                            <div className="text-600 mb-1">
                                                <i className="pi pi-credit-card mr-2"></i>Phương thức thanh toán
                                            </div>
                                            <div>{selectedOrder.payment_method_display}</div>
                                        </div>
                                        <div className="mb-3">
                                            <div className="text-600 mb-1">
                                                <i className="pi pi-info-circle mr-2"></i>Trạng thái thanh toán
                                            </div>
                                            <div>
                                                <Tag
                                                    value={selectedOrder.payment_status_display}
                                                    severity={selectedOrder.payment_status === 'paid' ? 'success' : selectedOrder.payment_status === 'failed' ? 'danger' : selectedOrder.payment_status === 'refunded' ? 'warning' : 'info'}
                                                />
                                            </div>
                                        </div>
                                        {selectedOrder.note && (
                                            <div>
                                                <div className="text-600 mb-1">
                                                    <i className="pi pi-comment mr-2"></i>Ghi chú
                                                </div>
                                                <div className="surface-100 p-3 border-round">{selectedOrder.note}</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="surface-0 p-4 border-round border-1 surface-border">
                                <h6 className="mt-0 mb-3">Thông tin người nhận</h6>
                                <Divider />
                                <div className="mb-3">
                                    <div className="text-600 mb-1">
                                        <i className="pi pi-user mr-2"></i>Họ tên
                                    </div>
                                    <div className="font-medium">{selectedOrder.full_name}</div>
                                </div>
                                <div className="mb-3">
                                    <div className="text-600 mb-1">
                                        <i className="pi pi-phone mr-2"></i>Số điện thoại
                                    </div>
                                    <div>{selectedOrder.phone}</div>
                                </div>
                                {selectedOrder.email && (
                                    <div className="mb-3">
                                        <div className="text-600 mb-1">
                                            <i className="pi pi-envelope mr-2"></i>Email
                                        </div>
                                        <div>{selectedOrder.email}</div>
                                    </div>
                                )}
                                <div>
                                    <div className="text-600 mb-1">
                                        <i className="pi pi-map-marker mr-2"></i>Địa chỉ
                                    </div>
                                    <div>
                                        {selectedOrder.address}
                                        {selectedOrder.district && `, ${selectedOrder.district}`}
                                        {selectedOrder.city && `, ${selectedOrder.city}`}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-12 lg:col-5">
                            <div className="surface-0 p-4 border-round border-1 surface-border">
                                <h6 className="mt-0 mb-3">Sản phẩm đặt hàng</h6>
                                <Divider />
                                {selectedOrder.items.map((item, index) => (
                                    <div key={item.id}>
                                        <div className="flex gap-3 mb-3">
                                            <div className="flex-1">
                                                <div className="font-bold mb-2">{item.product_name}</div>
                                                <div className="text-600 text-sm mb-1">
                                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.product_price)} × {item.quantity}
                                                </div>
                                            </div>
                                            <div className="font-bold text-primary">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.subtotal)}</div>
                                        </div>
                                        {index < selectedOrder.items.length - 1 && <Divider />}
                                    </div>
                                ))}

                                <Divider className="my-3" />

                                <div className="flex justify-content-between mb-2">
                                    <span className="text-600">Tạm tính:</span>
                                    <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedOrder.subtotal)}</span>
                                </div>
                                <div className="flex justify-content-between mb-3">
                                    <span className="text-600">Phí vận chuyển:</span>
                                    <span>
                                        {selectedOrder.shipping_fee === 0 ? <span className="text-green-500 font-medium">Miễn phí</span> : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedOrder.shipping_fee)}
                                    </span>
                                </div>

                                <Divider className="my-3" />

                                <div className="flex justify-content-between align-items-center">
                                    <span className="font-bold text-lg">Tổng cộng:</span>
                                    <span className="font-bold text-2xl text-primary">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedOrder.total)}</span>
                                </div>
                            </div>

                            {(selectedOrder.status === 'pending' || selectedOrder.status === 'confirmed') && (
                                <div className="mt-3">
                                    <Button
                                        label="Hủy đơn hàng"
                                        icon="pi pi-times"
                                        severity="danger"
                                        className="w-full"
                                        onClick={() => {
                                            setDetailDialog(false);
                                            cancelOrder(selectedOrder);
                                        }}
                                    />
                                </div>
                            )}

                            {selectedOrder.status === 'delivered' && (
                                <div className="mt-3 p-3 bg-green-50 border-round">
                                    <div className="flex align-items-center gap-2 text-green-700">
                                        <i className="pi pi-check-circle text-xl"></i>
                                        <span className="font-medium">Đơn hàng đã được giao thành công!</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </Dialog>
        </div>
    );
};

export default OrdersPage;
