/* eslint-disable @next/next/no-img-element */
'use client';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import React, { useRef, useState, useEffect } from 'react';
import { Tag } from 'primereact/tag';
import { orderAPI } from '@/services/api';
import { Divider } from 'primereact/divider';

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
    status: string;
    status_display: string;
    payment_method: string;
    payment_method_display: string;
    payment_status: string;
    payment_status_display: string;
    items: OrderItem[];
    created_at: string;
    updated_at: string;
    confirmed_at: string | null;
    delivered_at: string | null;
}

const OrdersPage = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [orderDialog, setOrderDialog] = useState(false);
    const [order, setOrder] = useState<Order | null>(null);
    const [globalFilter, setGlobalFilter] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
    const toast = useRef<Toast>(null);

    const statuses = [
        { label: 'Chờ xác nhận', value: 'pending' },
        { label: 'Đã xác nhận', value: 'confirmed' },
        { label: 'Đang xử lý', value: 'processing' },
        { label: 'Đang giao hàng', value: 'shipping' },
        { label: 'Đã giao hàng', value: 'delivered' },
        { label: 'Đã hủy', value: 'cancelled' },
        { label: 'Đã trả hàng', value: 'returned' }
    ];

    const paymentMethods = [
        { label: 'Thanh toán khi nhận hàng', value: 'cod' },
        { label: 'VNPay', value: 'vnpay' },
        { label: 'Momo', value: 'momo' },
        { label: 'Chuyển khoản', value: 'banking' }
    ];

    // Load data once on mount
    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        try {
            setLoading(true);
            const response = await orderAPI.getAll({ page_size: 1000 });

            if (response.results) {
                setOrders(response.results);
            } else if (Array.isArray(response)) {
                setOrders(response);
            } else if (response.data) {
                setOrders(Array.isArray(response.data) ? response.data : []);
            }
        } catch (error: any) {
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

    const clearFilters = () => {
        setGlobalFilter('');
        setSelectedStatus(null);
        setSelectedPaymentMethod(null);
    };

    // Client-side filtering
    const filteredOrders = orders.filter((order) => {
        // Filter by status
        if (selectedStatus !== null && order.status !== selectedStatus) {
            return false;
        }

        // Filter by payment method
        if (selectedPaymentMethod !== null && order.payment_method !== selectedPaymentMethod) {
            return false;
        }

        // Filter by search text (order_number, full_name, phone, email)
        if (globalFilter) {
            const searchLower = globalFilter.toLowerCase();
            const matchOrderNumber = order.order_number.toLowerCase().includes(searchLower);
            const matchName = order.full_name.toLowerCase().includes(searchLower);
            const matchPhone = order.phone.toLowerCase().includes(searchLower);
            const matchEmail = order.email?.toLowerCase().includes(searchLower);

            if (!matchOrderNumber && !matchName && !matchPhone && !matchEmail) {
                return false;
            }
        }

        return true;
    });

    const viewOrder = async (orderData: Order) => {
        setLoading(true);
        try {
            // Load full order details with items
            const response = await orderAPI.getById(orderData.id);
            setOrder(response);
            setOrderDialog(true);
        } catch (error: any) {
            console.error('Error loading order details:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Lỗi',
                detail: error.message || 'Không thể tải chi tiết đơn hàng',
                life: 3000
            });
        } finally {
            setLoading(false);
        }
    };

    const hideDialog = () => {
        setOrderDialog(false);
        setOrder(null);
    };

    const updateOrderStatus = async (newStatus: string) => {
        if (!order) return;

        setLoading(true);
        try {
            const response = await orderAPI.updateStatus(order.id, newStatus);

            if (response.order) {
                setOrder(response.order);
                loadOrders(); // Reload list

                toast.current?.show({
                    severity: 'success',
                    summary: 'Thành công',
                    detail: response.message || 'Cập nhật trạng thái đơn hàng thành công',
                    life: 3000
                });
            } else {
                throw new Error('Không thể cập nhật trạng thái');
            }
        } catch (error: any) {
            console.error('Error updating order status:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Lỗi',
                detail: error.message || 'Không thể cập nhật trạng thái đơn hàng',
                life: 3000
            });
        } finally {
            setLoading(false);
        }
    };

    const leftToolbarTemplate = () => {
        return (
            <div className="flex flex-wrap gap-2">
                <h4 className="m-0">Quản Lý Đơn Hàng</h4>
            </div>
        );
    };

    const actionBodyTemplate = (rowData: Order) => {
        return (
            <React.Fragment>
                <Button icon="pi pi-eye" rounded outlined className="mr-2" onClick={() => viewOrder(rowData)} />
            </React.Fragment>
        );
    };

    const statusBodyTemplate = (rowData: Order) => {
        const statusMap: { [key: string]: { label: string; severity: any } } = {
            pending: { label: 'Chờ xác nhận', severity: 'warning' },
            confirmed: { label: 'Đã xác nhận', severity: 'info' },
            processing: { label: 'Đang xử lý', severity: 'info' },
            shipping: { label: 'Đang giao hàng', severity: 'primary' },
            delivered: { label: 'Đã giao hàng', severity: 'success' },
            cancelled: { label: 'Đã hủy', severity: 'danger' },
            returned: { label: 'Đã trả hàng', severity: 'danger' }
        };
        const status = statusMap[rowData.status] || { label: rowData.status_display, severity: 'secondary' };
        return <Tag value={status.label} severity={status.severity} />;
    };

    const paymentMethodBodyTemplate = (rowData: Order) => {
        return rowData.payment_method_display || rowData.payment_method;
    };

    const totalAmountBodyTemplate = (rowData: Order) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(rowData.total);
    };

    const dateBodyTemplate = (rowData: Order) => {
        return new Date(rowData.created_at).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const header = (
        <div className="flex flex-column gap-3">
            <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
                <h4 className="m-0">Quản Lý Đơn Hàng</h4>
                <div className="flex gap-2">
                    <span className="p-input-icon-left">
                        <i className="pi pi-search" />
                        <InputText type="search" placeholder="Tìm kiếm..." value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} />
                    </span>
                </div>
            </div>

            {/* Advanced Filters */}
            <div className="flex flex-wrap gap-3 align-items-center">
                <div className="flex align-items-center gap-2">
                    <label htmlFor="statusFilter" className="font-semibold text-sm">
                        Trạng thái:
                    </label>
                    <Dropdown id="statusFilter" value={selectedStatus} options={[{ label: 'Tất cả trạng thái', value: null }, ...statuses]} onChange={(e) => setSelectedStatus(e.value)} placeholder="Chọn trạng thái" style={{ width: '200px' }} />
                </div>

                <div className="flex align-items-center gap-2">
                    <label htmlFor="paymentFilter" className="font-semibold text-sm">
                        Thanh toán:
                    </label>
                    <Dropdown
                        id="paymentFilter"
                        value={selectedPaymentMethod}
                        options={[{ label: 'Tất cả thanh toán', value: null }, ...paymentMethods]}
                        onChange={(e) => setSelectedPaymentMethod(e.value)}
                        placeholder="Chọn thanh toán"
                        style={{ width: '220px' }}
                    />
                </div>

                {(globalFilter || selectedStatus !== null || selectedPaymentMethod !== null) && <Button type="button" icon="pi pi-filter-slash" label="Xóa bộ lọc" outlined onClick={clearFilters} size="small" />}

                <div className="ml-auto">
                    <Tag value={`${filteredOrders.length} đơn hàng`} severity="info" icon="pi pi-shopping-cart" />
                </div>
            </div>
        </div>
    );

    const orderDialogFooter = (
        <React.Fragment>
            <Button label="Đóng" icon="pi pi-times" outlined onClick={hideDialog} />
        </React.Fragment>
    );

    return (
        <div className="grid">
            <div className="col-12">
                <div className="card">
                    <Toast ref={toast} />
                    <DataTable
                        value={filteredOrders}
                        dataKey="id"
                        paginator
                        rows={10}
                        rowsPerPageOptions={[5, 10, 25, 50]}
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        currentPageReportTemplate="Hiển thị {first} đến {last} trong tổng số {totalRecords} đơn hàng"
                        loading={loading}
                        header={header}
                        emptyMessage="Không có đơn hàng nào"
                    >
                        <Column field="order_number" header="Mã đơn" sortable style={{ minWidth: '10rem' }}></Column>
                        <Column field="full_name" header="Khách hàng" sortable style={{ minWidth: '12rem' }}></Column>
                        <Column field="phone" header="SĐT" sortable style={{ minWidth: '10rem' }}></Column>
                        <Column field="total" header="Tổng tiền" body={totalAmountBodyTemplate} sortable style={{ minWidth: '10rem' }}></Column>
                        <Column field="payment_method" header="Thanh toán" body={paymentMethodBodyTemplate} sortable style={{ minWidth: '12rem' }}></Column>
                        <Column field="status" header="Trạng thái" body={statusBodyTemplate} sortable style={{ minWidth: '12rem' }}></Column>
                        <Column field="created_at" header="Ngày đặt" body={dateBodyTemplate} sortable style={{ minWidth: '12rem' }}></Column>
                        <Column body={actionBodyTemplate} exportable={false} style={{ minWidth: '8rem' }}></Column>
                    </DataTable>

                    <Dialog visible={orderDialog} style={{ width: '70rem' }} breakpoints={{ '960px': '90vw', '641px': '95vw' }} header="Chi Tiết Đơn Hàng" modal className="p-fluid" footer={orderDialogFooter} onHide={hideDialog}>
                        {order && (
                            <div className="grid">
                                <div className="col-12">
                                    <div className="card">
                                        <h5>Thông tin đơn hàng</h5>
                                        <div className="p-fluid formgrid grid">
                                            <div className="field col-12 md:col-6">
                                                <label>
                                                    <strong>Mã đơn hàng:</strong>
                                                </label>
                                                <p className="text-lg">{order.order_number}</p>
                                            </div>
                                            <div className="field col-12 md:col-6">
                                                <label>
                                                    <strong>Ngày đặt:</strong>
                                                </label>
                                                <p>
                                                    {new Date(order.created_at).toLocaleString('vi-VN', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </p>
                                            </div>
                                            <div className="field col-12 md:col-6">
                                                <label>
                                                    <strong>Khách hàng:</strong>
                                                </label>
                                                <p>{order.full_name}</p>
                                            </div>
                                            <div className="field col-12 md:col-6">
                                                <label>
                                                    <strong>Số điện thoại:</strong>
                                                </label>
                                                <p>{order.phone}</p>
                                            </div>
                                            {order.email && (
                                                <div className="field col-12 md:col-6">
                                                    <label>
                                                        <strong>Email:</strong>
                                                    </label>
                                                    <p>{order.email}</p>
                                                </div>
                                            )}
                                            <div className="field col-12">
                                                <label>
                                                    <strong>Địa chỉ giao hàng:</strong>
                                                </label>
                                                <p>
                                                    {order.address}
                                                    {order.district && `, ${order.district}`}
                                                    {order.city && `, ${order.city}`}
                                                </p>
                                            </div>
                                            {order.note && (
                                                <div className="field col-12">
                                                    <label>
                                                        <strong>Ghi chú:</strong>
                                                    </label>
                                                    <p className="text-color-secondary">{order.note}</p>
                                                </div>
                                            )}
                                            <div className="field col-12 md:col-6">
                                                <label>
                                                    <strong>Phương thức thanh toán:</strong>
                                                </label>
                                                <p>{order.payment_method_display}</p>
                                            </div>
                                            <div className="field col-12 md:col-6">
                                                <label>
                                                    <strong>Trạng thái thanh toán:</strong>
                                                </label>
                                                <Tag value={order.payment_status_display} severity={order.payment_status === 'paid' ? 'success' : 'warning'} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Order Items */}
                                <div className="col-12">
                                    <div className="card">
                                        <h5>Sản phẩm trong đơn hàng</h5>
                                        <DataTable value={order.items} responsiveLayout="scroll">
                                            <Column field="product_name" header="Sản phẩm" style={{ minWidth: '200px' }} body={(rowData: OrderItem) => <div className="font-semibold">{rowData.product_name}</div>} />
                                            <Column
                                                field="product_price"
                                                header="Đơn giá"
                                                style={{ minWidth: '120px' }}
                                                body={(rowData: OrderItem) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(rowData.product_price)}
                                            />
                                            <Column field="quantity" header="Số lượng" style={{ minWidth: '100px' }} />
                                            <Column
                                                field="subtotal"
                                                header="Thành tiền"
                                                style={{ minWidth: '120px' }}
                                                body={(rowData: OrderItem) => <div className="font-semibold">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(rowData.subtotal)}</div>}
                                            />
                                        </DataTable>

                                        <Divider />

                                        <div className="flex flex-column align-items-end gap-2">
                                            <div className="flex justify-content-between" style={{ width: '300px' }}>
                                                <span>Tạm tính:</span>
                                                <span className="font-semibold">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.subtotal)}</span>
                                            </div>
                                            <div className="flex justify-content-between" style={{ width: '300px' }}>
                                                <span>Phí vận chuyển:</span>
                                                <span className="font-semibold">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.shipping_fee)}</span>
                                            </div>
                                            <Divider />
                                            <div className="flex justify-content-between" style={{ width: '300px' }}>
                                                <span className="text-xl font-bold">Tổng cộng:</span>
                                                <span className="text-2xl font-bold text-primary">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.total)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Update Status Section */}
                                <div className="col-12">
                                    <div className="card">
                                        <h5>Cập nhật trạng thái đơn hàng</h5>
                                        <div className="mb-3">
                                            <span className="font-semibold">Trạng thái hiện tại: </span>
                                            <Tag value={order.status_display} severity={statusBodyTemplate(order).props.severity} className="text-base" />
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {statuses.map((status) => (
                                                <Button
                                                    key={status.value}
                                                    label={status.label}
                                                    severity={order.status === status.value ? 'success' : 'secondary'}
                                                    outlined={order.status !== status.value}
                                                    disabled={order.status === status.value || loading}
                                                    onClick={() => updateOrderStatus(status.value)}
                                                    size="small"
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </Dialog>
                </div>
            </div>
        </div>
    );
};

export default OrdersPage;
