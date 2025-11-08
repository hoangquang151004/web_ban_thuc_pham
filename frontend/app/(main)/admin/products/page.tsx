/* eslint-disable @next/next/no-img-element */
'use client';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import { FileUpload } from 'primereact/fileupload';
import { Image } from 'primereact/image';
import React, { useRef, useState } from 'react';
import { Tag } from 'primereact/tag';

interface Product {
    id: number;
    name: string;
    category: string;
    price: number;
    stock: number;
    status: string;
    description: string;
    image?: string;
}

const ProductsPage = () => {
    const [products, setProducts] = useState<Product[]>([
        {
            id: 1,
            name: 'Cải Thảo Hữu Cơ',
            category: 'Rau Củ Quả',
            price: 25000,
            stock: 150,
            status: 'active',
            description: 'Cải thảo hữu cơ tươi sạch',
            image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=300'
        },
        {
            id: 2,
            name: 'Thịt Bò Úc',
            category: 'Thịt Tươi',
            price: 350000,
            stock: 50,
            status: 'active',
            description: 'Thịt bò Úc cao cấp nhập khẩu',
            image: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=300'
        },
        {
            id: 3,
            name: 'Tôm Sú Sống',
            category: 'Hải Sản',
            price: 280000,
            stock: 30,
            status: 'active',
            description: 'Tôm sú tươi sống size lớn',
            image: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=300'
        },
        {
            id: 4,
            name: 'Trứng Gà Organic',
            category: 'Trứng & Sữa',
            price: 65000,
            stock: 200,
            status: 'active',
            description: 'Trứng gà organic hộp 10 quả',
            image: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=300'
        },
        {
            id: 5,
            name: 'Gạo ST25',
            category: 'Gạo & Ngũ Cốc',
            price: 120000,
            stock: 100,
            status: 'active',
            description: 'Gạo ST25 cao cấp túi 5kg',
            image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300'
        }
    ]);

    const [productDialog, setProductDialog] = useState(false);
    const [deleteProductDialog, setDeleteProductDialog] = useState(false);
    const [product, setProduct] = useState<Product>({
        id: 0,
        name: '',
        category: '',
        price: 0,
        stock: 0,
        status: 'active',
        description: ''
    });
    const [globalFilter, setGlobalFilter] = useState('');
    const toast = useRef<Toast>(null);

    const categories = [
        { label: 'Rau Củ Quả', value: 'Rau Củ Quả' },
        { label: 'Thịt Tươi', value: 'Thịt Tươi' },
        { label: 'Hải Sản', value: 'Hải Sản' },
        { label: 'Trứng & Sữa', value: 'Trứng & Sữa' },
        { label: 'Gạo & Ngũ Cốc', value: 'Gạo & Ngũ Cốc' }
    ];

    const statuses = [
        { label: 'Đang bán', value: 'active' },
        { label: 'Hết hàng', value: 'out_of_stock' },
        { label: 'Ngừng bán', value: 'inactive' }
    ];

    const openNew = () => {
        setProduct({
            id: 0,
            name: '',
            category: '',
            price: 0,
            stock: 0,
            status: 'active',
            description: ''
        });
        setProductDialog(true);
    };

    const hideDialog = () => {
        setProductDialog(false);
    };

    const hideDeleteProductDialog = () => {
        setDeleteProductDialog(false);
    };

    const saveProduct = () => {
        if (product.name.trim()) {
            let _products = [...products];

            if (product.id) {
                const index = _products.findIndex((p) => p.id === product.id);
                _products[index] = product;
                toast.current?.show({
                    severity: 'success',
                    summary: 'Thành công',
                    detail: 'Cập nhật sản phẩm thành công',
                    life: 3000
                });
            } else {
                product.id = Math.max(..._products.map((p) => p.id), 0) + 1;
                _products.push(product);
                toast.current?.show({
                    severity: 'success',
                    summary: 'Thành công',
                    detail: 'Thêm sản phẩm thành công',
                    life: 3000
                });
            }

            setProducts(_products);
            setProductDialog(false);
            setProduct({
                id: 0,
                name: '',
                category: '',
                price: 0,
                stock: 0,
                status: 'active',
                description: ''
            });
        }
    };

    const editProduct = (product: Product) => {
        setProduct({ ...product });
        setProductDialog(true);
    };

    const confirmDeleteProduct = (product: Product) => {
        setProduct(product);
        setDeleteProductDialog(true);
    };

    const deleteProduct = () => {
        let _products = products.filter((val) => val.id !== product.id);
        setProducts(_products);
        setDeleteProductDialog(false);
        setProduct({
            id: 0,
            name: '',
            category: '',
            price: 0,
            stock: 0,
            status: 'active',
            description: ''
        });
        toast.current?.show({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Xóa sản phẩm thành công',
            life: 3000
        });
    };

    const onInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, name: string) => {
        const val = (e.target && e.target.value) || '';
        let _product = { ...product };
        (_product as any)[name] = val;
        setProduct(_product);
    };

    const onNumberChange = (value: number | null | undefined, name: string) => {
        let _product = { ...product };
        (_product as any)[name] = value || 0;
        setProduct(_product);
    };

    const onDropdownChange = (e: any, name: string) => {
        const val = e.value || '';
        let _product = { ...product };
        (_product as any)[name] = val;
        setProduct(_product);
    };

    const onImageSelect = (e: any) => {
        const file = e.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event: any) => {
                setProduct({ ...product, image: event.target.result });
            };
            reader.readAsDataURL(file);
        }
    };

    const onImageRemove = () => {
        setProduct({ ...product, image: undefined });
    };

    const leftToolbarTemplate = () => {
        return (
            <div className="flex flex-wrap gap-2">
                <Button label="Thêm mới" icon="pi pi-plus" severity="success" onClick={openNew} />
            </div>
        );
    };

    const actionBodyTemplate = (rowData: Product) => {
        return (
            <React.Fragment>
                <Button icon="pi pi-pencil" rounded outlined className="mr-2" onClick={() => editProduct(rowData)} />
                <Button icon="pi pi-trash" rounded outlined severity="danger" onClick={() => confirmDeleteProduct(rowData)} />
            </React.Fragment>
        );
    };

    const statusBodyTemplate = (rowData: Product) => {
        const statusMap: { [key: string]: { label: string; severity: any } } = {
            active: { label: 'Đang bán', severity: 'success' },
            out_of_stock: { label: 'Hết hàng', severity: 'warning' },
            inactive: { label: 'Ngừng bán', severity: 'danger' }
        };
        const status = statusMap[rowData.status] || statusMap['active'];
        return <Tag value={status.label} severity={status.severity} />;
    };

    const priceBodyTemplate = (rowData: Product) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(rowData.price);
    };

    const stockBodyTemplate = (rowData: Product) => {
        return <span className={rowData.stock < 50 ? 'text-orange-500 font-bold' : ''}>{rowData.stock}</span>;
    };

    const imageBodyTemplate = (rowData: Product) => {
        return rowData.image ? (
            <img src={rowData.image} alt={rowData.name} className="shadow-2 border-round" style={{ width: '64px', height: '64px', objectFit: 'cover' }} />
        ) : (
            <div className="flex align-items-center justify-content-center border-round" style={{ width: '64px', height: '64px', background: '#f8f9fa' }}>
                <i className="pi pi-image" style={{ fontSize: '2rem', color: '#dee2e6' }}></i>
            </div>
        );
    };

    const header = (
        <div className="flex flex-wrap gap-2 align-items-center justify-content-between">
            <h4 className="m-0">Quản Lý Sản Phẩm</h4>
            <span className="p-input-icon-left">
                <i className="pi pi-search" />
                <InputText type="search" placeholder="Tìm kiếm..." onInput={(e) => setGlobalFilter((e.target as HTMLInputElement).value)} />
            </span>
        </div>
    );

    const productDialogFooter = (
        <React.Fragment>
            <Button label="Hủy" icon="pi pi-times" outlined onClick={hideDialog} />
            <Button label="Lưu" icon="pi pi-check" onClick={saveProduct} />
        </React.Fragment>
    );

    const deleteProductDialogFooter = (
        <React.Fragment>
            <Button label="Không" icon="pi pi-times" outlined onClick={hideDeleteProductDialog} />
            <Button label="Có" icon="pi pi-check" severity="danger" onClick={deleteProduct} />
        </React.Fragment>
    );

    return (
        <div className="grid">
            <div className="col-12">
                <div className="card">
                    <Toast ref={toast} />
                    <Toolbar className="mb-4" left={leftToolbarTemplate}></Toolbar>

                    <DataTable
                        value={products}
                        dataKey="id"
                        paginator
                        rows={10}
                        rowsPerPageOptions={[5, 10, 25]}
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        currentPageReportTemplate="Hiển thị {first} đến {last} trong tổng số {totalRecords} sản phẩm"
                        globalFilter={globalFilter}
                        header={header}
                    >
                        <Column field="id" header="ID" sortable style={{ minWidth: '4rem' }}></Column>
                        <Column header="Hình ảnh" body={imageBodyTemplate} style={{ minWidth: '8rem' }}></Column>
                        <Column field="name" header="Tên sản phẩm" sortable style={{ minWidth: '14rem' }}></Column>
                        <Column field="category" header="Danh mục" sortable style={{ minWidth: '10rem' }}></Column>
                        <Column field="price" header="Giá" body={priceBodyTemplate} sortable style={{ minWidth: '10rem' }}></Column>
                        <Column field="stock" header="Tồn kho" body={stockBodyTemplate} sortable style={{ minWidth: '8rem' }}></Column>
                        <Column field="status" header="Trạng thái" body={statusBodyTemplate} sortable style={{ minWidth: '10rem' }}></Column>
                        <Column body={actionBodyTemplate} exportable={false} style={{ minWidth: '12rem' }}></Column>
                    </DataTable>

                    <Dialog visible={productDialog} style={{ width: '50rem' }} breakpoints={{ '960px': '75vw', '641px': '90vw' }} header="Thông tin sản phẩm" modal className="p-fluid" footer={productDialogFooter} onHide={hideDialog}>
                        <div className="grid">
                            <div className="col-12 md:col-6">
                                <div className="field">
                                    <label htmlFor="name">Tên sản phẩm</label>
                                    <InputText id="name" value={product.name} onChange={(e) => onInputChange(e, 'name')} required autoFocus />
                                </div>
                                <div className="field">
                                    <label htmlFor="category">Danh mục</label>
                                    <Dropdown id="category" value={product.category} options={categories} onChange={(e) => onDropdownChange(e, 'category')} placeholder="Chọn danh mục" />
                                </div>
                                <div className="field">
                                    <label htmlFor="price">Giá (VNĐ)</label>
                                    <InputNumber id="price" value={product.price} onValueChange={(e) => onNumberChange(e.value, 'price')} mode="currency" currency="VND" locale="vi-VN" />
                                </div>
                                <div className="field">
                                    <label htmlFor="stock">Số lượng tồn kho</label>
                                    <InputNumber id="stock" value={product.stock} onValueChange={(e) => onNumberChange(e.value, 'stock')} />
                                </div>
                                <div className="field">
                                    <label htmlFor="status">Trạng thái</label>
                                    <Dropdown id="status" value={product.status} options={statuses} onChange={(e) => onDropdownChange(e, 'status')} placeholder="Chọn trạng thái" />
                                </div>
                            </div>
                            <div className="col-12 md:col-6">
                                <div className="field">
                                    <label>Hình ảnh sản phẩm</label>
                                    {product.image ? (
                                        <div className="flex flex-column align-items-center">
                                            <Image src={product.image} alt="Preview" width="250" preview />
                                            <Button label="Xóa hình ảnh" icon="pi pi-times" className="p-button-danger p-button-sm mt-2" onClick={onImageRemove} type="button" />
                                        </div>
                                    ) : (
                                        <FileUpload mode="basic" name="image" accept="image/*" maxFileSize={5000000} onSelect={onImageSelect} chooseLabel="Chọn hình ảnh" className="w-full" auto />
                                    )}
                                    <small className="block mt-2 text-500">Định dạng: JPG, PNG, GIF. Kích thước tối đa: 5MB</small>
                                </div>
                                <div className="field">
                                    <label htmlFor="description">Mô tả</label>
                                    <InputTextarea id="description" value={product.description} onChange={(e) => onInputChange(e, 'description')} rows={8} />
                                </div>
                            </div>
                        </div>
                    </Dialog>

                    <Dialog visible={deleteProductDialog} style={{ width: '32rem' }} breakpoints={{ '960px': '75vw', '641px': '90vw' }} header="Xác nhận" modal footer={deleteProductDialogFooter} onHide={hideDeleteProductDialog}>
                        <div className="confirmation-content">
                            <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                            {product && (
                                <span>
                                    Bạn có chắc chắn muốn xóa sản phẩm <b>{product.name}</b>?
                                </span>
                            )}
                        </div>
                    </Dialog>
                </div>
            </div>
        </div>
    );
};

export default ProductsPage;
