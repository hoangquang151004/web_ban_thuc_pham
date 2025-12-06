/* eslint-disable @next/next/no-img-element */
'use client';
import { Button } from 'primereact/button';
import { Chart } from 'primereact/chart';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import React, { useContext, useEffect, useState, useRef } from 'react';
import { LayoutContext } from '../../../../layout/context/layoutcontext';
import { ChartData, ChartOptions } from 'chart.js';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { reportsAPI } from '../../../../services/api';
import { useRouter } from 'next/navigation';
import { Toast } from 'primereact/toast';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface DashboardStats {
    revenue: {
        current: number;
        previous: number;
        change_percent: number;
    };
    orders: {
        current: number;
        previous: number;
        change_percent: number;
    };
    customers: {
        current: number;
        previous: number;
        change_percent: number;
    };
    completion_rate: {
        current: number;
        previous: number;
        change_percent: number;
    };
}

interface TopProduct {
    rank: number;
    product_id: number;
    name: string;
    category: string;
    sold: number;
    revenue: number;
}

const ReportsPage = () => {
    const router = useRouter();
    const toast = useRef<Toast>(null);
    const [selectedDateRange, setSelectedDateRange] = useState<Date[] | null>(null);
    const [reportType, setReportType] = useState('revenue');
    const { layoutConfig } = useContext(LayoutContext);
    const [loading, setLoading] = useState(true);

    // State for dashboard statistics
    const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
    const [productsData, setProductsData] = useState<TopProduct[]>([]);
    const [revenueByMonth, setRevenueByMonth] = useState<any[]>([]);
    const [ordersByWeek, setOrdersByWeek] = useState<any[]>([]);
    const [revenueByCategory, setRevenueByCategory] = useState<any[]>([]);

    const reportTypes = [
        { label: 'Doanh thu', value: 'revenue' },
        { label: 'Đơn hàng', value: 'orders' },
        { label: 'Sản phẩm bán chạy', value: 'products' },
        { label: 'Khách hàng', value: 'customers' }
    ];

    // Prepare chart data from loaded data
    const revenueData: ChartData = {
        labels: revenueByMonth.map((item) => {
            const date = new Date(item.month);
            return `Tháng ${date.getMonth() + 1}`;
        }),
        datasets: [
            {
                label: 'Doanh thu (VNĐ)',
                data: revenueByMonth.map((item) => item.total),
                fill: false,
                backgroundColor: '#42A5F5',
                borderColor: '#42A5F5',
                tension: 0.4
            }
        ]
    };

    const ordersData: ChartData = {
        labels: ordersByWeek.map((item) => {
            if (item.week_number) {
                return `Tuần ${item.week_number}`;
            }
            return `Tuần ${ordersByWeek.indexOf(item) + 1}`;
        }),
        datasets: [
            {
                label: 'Số đơn hàng',
                data: ordersByWeek.map((item) => item.count),
                backgroundColor: '#66BB6A',
                borderColor: '#66BB6A'
            }
        ]
    };

    const categoryData: ChartData = {
        labels: revenueByCategory.map((item) => item.category_name || 'Khác'),
        datasets: [
            {
                data: revenueByCategory.map((item) => item.total),
                backgroundColor: ['#42A5F5', '#66BB6A', '#FFA726', '#26C6DA', '#AB47BC']
            }
        ]
    };

    const [chartOptions, setChartOptions] = useState<ChartOptions>({});

    const applyLightTheme = () => {
        const options: ChartOptions = {
            plugins: {
                legend: {
                    labels: {
                        color: '#495057'
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: '#495057'
                    },
                    grid: {
                        color: '#ebedef'
                    }
                },
                y: {
                    ticks: {
                        color: '#495057'
                    },
                    grid: {
                        color: '#ebedef'
                    }
                }
            }
        };

        setChartOptions(options);
    };

    const applyDarkTheme = () => {
        const options: ChartOptions = {
            plugins: {
                legend: {
                    labels: {
                        color: '#ebedef'
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: '#ebedef'
                    },
                    grid: {
                        color: 'rgba(160, 167, 181, .3)'
                    }
                },
                y: {
                    ticks: {
                        color: '#ebedef'
                    },
                    grid: {
                        color: 'rgba(160, 167, 181, .3)'
                    }
                }
            }
        };

        setChartOptions(options);
    };

    useEffect(() => {
        if (layoutConfig.colorScheme === 'light') {
            applyLightTheme();
        } else {
            applyDarkTheme();
        }
    }, [layoutConfig.colorScheme]);

    // Load data on component mount
    useEffect(() => {
        loadData();
    }, [selectedDateRange]);

    const loadData = async () => {
        try {
            setLoading(true);

            // Prepare date range parameters
            let dateParams: { start_date?: string; end_date?: string } = {};
            let hasDateRange = false;
            if (selectedDateRange && selectedDateRange.length === 2 && selectedDateRange[0] && selectedDateRange[1]) {
                dateParams = {
                    start_date: selectedDateRange[0].toISOString(),
                    end_date: selectedDateRange[1].toISOString()
                };
                hasDateRange = true;
            }

            // Load all data in parallel - use date range when selected
            const [dashboardData, topProductsData, revenueMonthData, ordersWeekData, revenueCategoryData] = await Promise.all([
                reportsAPI.getDashboard(dateParams),
                reportsAPI.getTopProducts({ ...dateParams, limit: 5 }),
                reportsAPI.getRevenueByMonth(hasDateRange ? dateParams : 6),
                reportsAPI.getOrdersByWeek(hasDateRange ? dateParams : 4),
                reportsAPI.getRevenueByCategory(dateParams)
            ]);

            setDashboardStats(dashboardData);
            setProductsData(Array.isArray(topProductsData) ? topProductsData : []);
            setRevenueByMonth(Array.isArray(revenueMonthData) ? revenueMonthData : []);
            setOrdersByWeek(Array.isArray(ordersWeekData) ? ordersWeekData : []);
            setRevenueByCategory(Array.isArray(revenueCategoryData) ? revenueCategoryData : []);
        } catch (error: any) {
            console.error('Error loading report data:', error);
            if (error.message && error.message.includes('403')) {
                toast.current?.show({
                    severity: 'error',
                    summary: 'Lỗi',
                    detail: 'Bạn không có quyền truy cập trang này',
                    life: 3000
                });
                router.push('/');
            } else {
                toast.current?.show({
                    severity: 'error',
                    summary: 'Lỗi',
                    detail: 'Không thể tải dữ liệu báo cáo',
                    life: 3000
                });
            }
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
    };

    const formatNumber = (value: number) => {
        return new Intl.NumberFormat('vi-VN').format(value);
    };

    const handleExportExcel = () => {
        try {
            // Prepare date range text
            let periodText = '';
            if (selectedDateRange && selectedDateRange[0] && selectedDateRange[1]) {
                periodText = `Từ ${selectedDateRange[0].toLocaleDateString('vi-VN')} đến ${selectedDateRange[1].toLocaleDateString('vi-VN')}`;
            } else {
                periodText = `Tháng ${new Date().getMonth() + 1}/${new Date().getFullYear()}`;
            }

            // Prepare data for Excel export
            const workbook = XLSX.utils.book_new();

            // Sheet 1: Dashboard Statistics
            if (dashboardStats) {
                const dashboardData = [
                    ['BÁO CÁO THỐNG KÊ TỔNG QUAN'],
                    [`Khoảng thời gian: ${periodText}`],
                    [''],
                    ['Chỉ số', 'Hiện tại', 'Tháng trước', 'Thay đổi (%)'],
                    ['Doanh thu (VNĐ)', dashboardStats.revenue.current, dashboardStats.revenue.previous, dashboardStats.revenue.change_percent],
                    ['Số đơn hàng', dashboardStats.orders.current, dashboardStats.orders.previous, dashboardStats.orders.change_percent],
                    ['Khách hàng mới', dashboardStats.customers.current, dashboardStats.customers.previous, dashboardStats.customers.change_percent],
                    ['Tỷ lệ hoàn thành (%)', dashboardStats.completion_rate.current, dashboardStats.completion_rate.previous, dashboardStats.completion_rate.change_percent]
                ];
                const ws1 = XLSX.utils.aoa_to_sheet(dashboardData);
                XLSX.utils.book_append_sheet(workbook, ws1, 'Tổng quan');
            }

            // Sheet 2: Revenue by Month
            if (revenueByMonth.length > 0) {
                const revenueData = [
                    ['DOANH THU THEO THÁNG'],
                    [`Khoảng thời gian: ${periodText}`],
                    [''],
                    ['Tháng', 'Doanh thu (VNĐ)'],
                    ...revenueByMonth.map((item) => {
                        const date = new Date(item.month);
                        return [`Tháng ${date.getMonth() + 1}/${date.getFullYear()}`, item.total];
                    })
                ];
                const ws2 = XLSX.utils.aoa_to_sheet(revenueData);
                XLSX.utils.book_append_sheet(workbook, ws2, 'Doanh thu theo tháng');
            }

            // Sheet 3: Orders by Week
            if (ordersByWeek.length > 0) {
                const ordersData = [['SỐ ĐƠN HÀNG THEO TUẦN'], [`Khoảng thời gian: ${periodText}`], [''], ['Tuần', 'Số đơn hàng'], ...ordersByWeek.map((item, index) => [`Tuần ${index + 1}`, item.count])];
                const ws3 = XLSX.utils.aoa_to_sheet(ordersData);
                XLSX.utils.book_append_sheet(workbook, ws3, 'Đơn hàng theo tuần');
            }

            // Sheet 4: Revenue by Category
            if (revenueByCategory.length > 0) {
                const categoryData = [['DOANH THU THEO DANH MỤC'], [`Khoảng thời gian: ${periodText}`], [''], ['Danh mục', 'Doanh thu (VNĐ)'], ...revenueByCategory.map((item) => [item.category_name || 'Khác', item.total])];
                const ws4 = XLSX.utils.aoa_to_sheet(categoryData);
                XLSX.utils.book_append_sheet(workbook, ws4, 'Doanh thu theo danh mục');
            }

            // Sheet 5: Top Products
            if (productsData.length > 0) {
                const productsExportData = [
                    ['TOP 5 SẢN PHẨM BÁN CHẠY'],
                    [`Khoảng thời gian: ${periodText}`],
                    [''],
                    ['Hạng', 'Sản phẩm', 'Danh mục', 'Đã bán', 'Doanh thu (VNĐ)'],
                    ...productsData.map((item) => [item.rank, item.name, item.category, item.sold, item.revenue])
                ];
                const ws5 = XLSX.utils.aoa_to_sheet(productsExportData);
                XLSX.utils.book_append_sheet(workbook, ws5, 'Top sản phẩm');
            }

            // Generate Excel file
            const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
            const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

            // Generate filename with current date
            const dateStr = selectedDateRange && selectedDateRange[0] && selectedDateRange[1] ? `${selectedDateRange[0].toLocaleDateString('vi-VN')}_${selectedDateRange[1].toLocaleDateString('vi-VN')}` : new Date().toLocaleDateString('vi-VN');

            saveAs(data, `Bao_cao_${dateStr.replace(/\//g, '-')}.xlsx`);

            toast.current?.show({
                severity: 'success',
                summary: 'Thành công',
                detail: 'Xuất báo cáo Excel thành công',
                life: 3000
            });
        } catch (error) {
            console.error('Error exporting Excel:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Lỗi',
                detail: 'Không thể xuất báo cáo Excel',
                life: 3000
            });
        }
    };

    const handleExportPDF = () => {
        try {
            const doc = new jsPDF();

            // Add Vietnamese font support (using default font for simplicity)
            doc.setFont('helvetica');

            // Title
            doc.setFontSize(18);
            doc.text('BAO CAO THONG KE TONG QUAN', 105, 15, { align: 'center' });

            // Date range
            let dateRangeText = 'Thoi gian: ';
            if (selectedDateRange && selectedDateRange[0] && selectedDateRange[1]) {
                dateRangeText += `Tu ${selectedDateRange[0].toLocaleDateString('vi-VN')} den ${selectedDateRange[1].toLocaleDateString('vi-VN')}`;
            } else {
                dateRangeText += `Thang ${new Date().getMonth() + 1}/${new Date().getFullYear()}`;
            }
            doc.setFontSize(10);
            doc.text(dateRangeText, 105, 25, { align: 'center' });

            let yPosition = 35;

            // Dashboard Statistics
            if (dashboardStats) {
                doc.setFontSize(14);
                doc.text('THONG KE TONG QUAN', 14, yPosition);
                yPosition += 5;

                autoTable(doc, {
                    startY: yPosition,
                    head: [['Chi so', 'Hien tai', 'Thang truoc', 'Thay doi (%)']],
                    body: [
                        ['Doanh thu (VND)', formatNumber(dashboardStats.revenue.current), formatNumber(dashboardStats.revenue.previous), dashboardStats.revenue.change_percent.toFixed(1)],
                        ['So don hang', dashboardStats.orders.current, dashboardStats.orders.previous, dashboardStats.orders.change_percent.toFixed(1)],
                        ['Khach hang moi', dashboardStats.customers.current, dashboardStats.customers.previous, dashboardStats.customers.change_percent.toFixed(1)],
                        ['Ty le hoan thanh (%)', dashboardStats.completion_rate.current.toFixed(1), dashboardStats.completion_rate.previous.toFixed(1), dashboardStats.completion_rate.change_percent.toFixed(1)]
                    ],
                    theme: 'grid',
                    styles: { font: 'helvetica', fontSize: 9 }
                });
                yPosition = (doc as any).lastAutoTable.finalY + 10;
            }

            // Top Products
            if (productsData.length > 0 && yPosition < 250) {
                doc.setFontSize(14);
                doc.text('TOP 5 SAN PHAM BAN CHAY', 14, yPosition);
                yPosition += 5;

                autoTable(doc, {
                    startY: yPosition,
                    head: [['Hang', 'San pham', 'Danh muc', 'Da ban', 'Doanh thu (VND)']],
                    body: productsData.map((item) => [item.rank, item.name, item.category, item.sold, formatNumber(item.revenue)]),
                    theme: 'grid',
                    styles: { font: 'helvetica', fontSize: 9 }
                });
                yPosition = (doc as any).lastAutoTable.finalY + 10;
            }

            // Add new page for revenue by category if needed
            if (revenueByCategory.length > 0 && yPosition > 250) {
                doc.addPage();
                yPosition = 20;
            }

            // Revenue by Category
            if (revenueByCategory.length > 0 && yPosition < 250) {
                doc.setFontSize(14);
                doc.text('DOANH THU THEO DANH MUC', 14, yPosition);
                yPosition += 5;

                autoTable(doc, {
                    startY: yPosition,
                    head: [['Danh muc', 'Doanh thu (VND)']],
                    body: revenueByCategory.map((item) => [item.category_name || 'Khac', formatNumber(item.total)]),
                    theme: 'grid',
                    styles: { font: 'helvetica', fontSize: 9 }
                });
            }

            // Generate filename with current date
            const dateStr = selectedDateRange && selectedDateRange[0] && selectedDateRange[1] ? `${selectedDateRange[0].toLocaleDateString('vi-VN')}_${selectedDateRange[1].toLocaleDateString('vi-VN')}` : new Date().toLocaleDateString('vi-VN');

            doc.save(`Bao_cao_${dateStr.replace(/\//g, '-')}.pdf`);

            toast.current?.show({
                severity: 'success',
                summary: 'Thành công',
                detail: 'Xuất báo cáo PDF thành công',
                life: 3000
            });
        } catch (error) {
            console.error('Error exporting PDF:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Lỗi',
                detail: 'Không thể xuất báo cáo PDF',
                life: 3000
            });
        }
    };

    if (loading) {
        return (
            <div className="flex align-items-center justify-content-center" style={{ height: '80vh' }}>
                <div className="text-center">
                    <i className="pi pi-spin pi-spinner" style={{ fontSize: '3rem' }}></i>
                    <p className="mt-3">Đang tải dữ liệu...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <Toast ref={toast} />
            <div className="grid">
                <div className="col-12">
                    <div className="card">
                        <h5>Thống Kê & Báo Cáo</h5>
                        <div className="grid">
                            <div className="col-12 md:col-6">
                                <label htmlFor="dateRange">Khoảng thời gian</label>
                                <div className="flex gap-2">
                                    <Calendar
                                        id="dateRange"
                                        value={selectedDateRange}
                                        onChange={(e) => setSelectedDateRange(e.value as Date[])}
                                        selectionMode="range"
                                        readOnlyInput
                                        placeholder="Chọn khoảng thời gian"
                                        className="w-full mt-2"
                                        dateFormat="dd/mm/yy"
                                    />
                                    {selectedDateRange && <Button icon="pi pi-times" className="mt-2" severity="secondary" outlined onClick={() => setSelectedDateRange(null)} tooltip="Xóa bộ lọc" tooltipOptions={{ position: 'top' }} />}
                                </div>
                            </div>
                            <div className="col-12 md:col-6 mt-4">
                                <Button label="Xuất báo cáo Excel" icon="pi pi-download" className="mr-2" onClick={handleExportExcel} />
                                {/* <Button label="Xuất báo cáo PDF" icon="pi pi-file-pdf" severity="danger" onClick={handleExportPDF} /> */}
                            </div>
                        </div>
                    </div>
                </div>

                {dashboardStats && (
                    <>
                        <div className="col-12 lg:col-6 xl:col-3">
                            <div className="card mb-0">
                                <div className="flex justify-content-between mb-3">
                                    <div>
                                        <span className="block text-500 font-medium mb-3">{selectedDateRange && selectedDateRange[0] && selectedDateRange[1] ? 'Doanh Thu Khoảng Thời Gian' : 'Doanh Thu Tháng Này'}</span>
                                        <div className="text-900 font-medium text-xl">{formatCurrency(dashboardStats.revenue.current)}</div>
                                    </div>
                                    <div className="flex align-items-center justify-content-center bg-blue-100 border-round" style={{ width: '2.5rem', height: '2.5rem' }}>
                                        <i className="pi pi-dollar text-blue-500 text-xl" />
                                    </div>
                                </div>
                                <span className={`${dashboardStats.revenue.change_percent >= 0 ? 'text-green-500' : 'text-red-500'} font-medium`}>
                                    {dashboardStats.revenue.change_percent >= 0 ? '+' : ''}
                                    {dashboardStats.revenue.change_percent.toFixed(1)}%{' '}
                                </span>
                                <span className="text-500">so với khoảng trước</span>
                            </div>
                        </div>

                        <div className="col-12 lg:col-6 xl:col-3">
                            <div className="card mb-0">
                                <div className="flex justify-content-between mb-3">
                                    <div>
                                        <span className="block text-500 font-medium mb-3">Đơn Hàng</span>
                                        <div className="text-900 font-medium text-xl">{formatNumber(dashboardStats.orders.current)}</div>
                                    </div>
                                    <div className="flex align-items-center justify-content-center bg-orange-100 border-round" style={{ width: '2.5rem', height: '2.5rem' }}>
                                        <i className="pi pi-shopping-cart text-orange-500 text-xl" />
                                    </div>
                                </div>
                                <span className={`${dashboardStats.orders.change_percent >= 0 ? 'text-green-500' : 'text-red-500'} font-medium`}>
                                    {dashboardStats.orders.change_percent >= 0 ? '+' : ''}
                                    {dashboardStats.orders.change_percent.toFixed(1)}%{' '}
                                </span>
                                <span className="text-500">so với khoảng trước</span>
                            </div>
                        </div>

                        <div className="col-12 lg:col-6 xl:col-3">
                            <div className="card mb-0">
                                <div className="flex justify-content-between mb-3">
                                    <div>
                                        <span className="block text-500 font-medium mb-3">Khách Hàng Mới</span>
                                        <div className="text-900 font-medium text-xl">{formatNumber(dashboardStats.customers.current)}</div>
                                    </div>
                                    <div className="flex align-items-center justify-content-center bg-cyan-100 border-round" style={{ width: '2.5rem', height: '2.5rem' }}>
                                        <i className="pi pi-users text-cyan-500 text-xl" />
                                    </div>
                                </div>
                                <span className={`${dashboardStats.customers.change_percent >= 0 ? 'text-green-500' : 'text-red-500'} font-medium`}>
                                    {dashboardStats.customers.change_percent >= 0 ? '+' : ''}
                                    {dashboardStats.customers.change_percent.toFixed(1)}%{' '}
                                </span>
                                <span className="text-500">so với khoảng trước</span>
                            </div>
                        </div>

                        <div className="col-12 lg:col-6 xl:col-3">
                            <div className="card mb-0">
                                <div className="flex justify-content-between mb-3">
                                    <div>
                                        <span className="block text-500 font-medium mb-3">Tỷ Lệ Hoàn Thành</span>
                                        <div className="text-900 font-medium text-xl">{dashboardStats.completion_rate.current.toFixed(1)}%</div>
                                    </div>
                                    <div className="flex align-items-center justify-content-center bg-purple-100 border-round" style={{ width: '2.5rem', height: '2.5rem' }}>
                                        <i className="pi pi-check-circle text-purple-500 text-xl" />
                                    </div>
                                </div>
                                <span className={`${dashboardStats.completion_rate.change_percent >= 0 ? 'text-green-500' : 'text-red-500'} font-medium`}>
                                    {dashboardStats.completion_rate.change_percent >= 0 ? '+' : ''}
                                    {dashboardStats.completion_rate.change_percent.toFixed(1)}%{' '}
                                </span>
                                <span className="text-500">so với khoảng trước</span>
                            </div>
                        </div>
                    </>
                )}

                <div className="col-12 xl:col-6">
                    <div className="card">
                        <h5>Doanh Thu Theo Tháng</h5>
                        {revenueByMonth.length > 0 ? <Chart type="line" data={revenueData} options={chartOptions} /> : <p className="text-center text-500">Không có dữ liệu</p>}
                    </div>
                </div>

                <div className="col-12 xl:col-6">
                    <div className="card">
                        <h5>Số Đơn Hàng Theo Tuần</h5>
                        {ordersByWeek.length > 0 ? <Chart type="bar" data={ordersData} options={chartOptions} /> : <p className="text-center text-500">Không có dữ liệu</p>}
                    </div>
                </div>

                <div className="col-12 xl:col-6">
                    <div className="card">
                        <h5>Doanh Thu Theo Danh Mục</h5>
                        {revenueByCategory.length > 0 ? <Chart type="pie" data={categoryData} /> : <p className="text-center text-500">Không có dữ liệu</p>}
                    </div>
                </div>

                <div className="col-12 xl:col-6">
                    <div className="card">
                        <h5>Top 5 Sản Phẩm Bán Chạy</h5>
                        {productsData.length > 0 ? (
                            <DataTable value={productsData} responsiveLayout="scroll">
                                <Column field="rank" header="Hạng" style={{ width: '10%' }}></Column>
                                <Column field="name" header="Sản phẩm" style={{ width: '30%' }}></Column>
                                <Column field="category" header="Danh mục" style={{ width: '25%' }}></Column>
                                <Column field="sold" header="Đã bán" style={{ width: '15%' }}></Column>
                                <Column field="revenue" header="Doanh thu" body={(data) => formatCurrency(data.revenue)} style={{ width: '20%' }}></Column>
                            </DataTable>
                        ) : (
                            <p className="text-center text-500">Không có dữ liệu</p>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default ReportsPage;
