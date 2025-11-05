"use client";
import React from "react";
import { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Menu } from "primereact/menu";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";

export function StripedRowsDemo() {
  type data = {
    code: string;
    name: string;
    category: string;
    quantity: number;
  };
  const [products, setProducts] = useState<Array<data>>([]);

  useEffect(() => {
    setProducts([
      { code: "P100", name: "Apple", category: "Fruits", quantity: 10 },
      { code: "P101", name: "Banana", category: "Fruits", quantity: 20 },
      { code: "P102", name: "Carrot", category: "Vegetables", quantity: 15 },
      { code: "P103", name: "Broccoli", category: "Vegetables", quantity: 8 },
      { code: "P104", name: "Chicken", category: "Meat", quantity: 5 },
    ]);
  }, []);

  return (
    <div className="card">
      <DataTable
        value={products}
        stripedRows
        tableStyle={{ minWidth: "50rem" }}
      >
        <Column field="code" header="Code"></Column>
        <Column field="name" header="Name"></Column>
        <Column field="category" header="Category"></Column>
        <Column field="quantity" header="Quantity"></Column>
      </DataTable>
    </div>
  );
}

export function BasicDemo() {
  const [visible, setVisible] = useState(false);

  return (
    <div className="card flex justify-content-center">
      <Button
        label="Show"
        icon="pi pi-external-link"
        onClick={() => setVisible(true)}
      />
      <Dialog
        header="Header"
        visible={visible}
        style={{ width: "50vw" }}
        onHide={() => {
          if (!visible) return;
          setVisible(false);
        }}
      >
        <StripedRowsDemo />
      </Dialog>
    </div>
  );
}

export function GroupDemo() {
  const toast = useRef(null);
  const items = [
    {
      label: "Documents",
      items: [
        {
          label: "New",
          icon: "pi pi-plus",
        },
        {
          label: "Search",
          icon: "pi pi-search",
        },
      ],
    },
    {
      label: "Profile",
      items: [
        {
          label: "Settings",
          icon: "pi pi-cog",
        },
        {
          label: "Logout",
          icon: "pi pi-sign-out",
        },
      ],
    },
  ];

  return (
    <div className="card flex justify-content-center">
      <Toast ref={toast} />
      <Menu model={items} />
    </div>
  );
}

export default function TestPage() {
  type data = {
    code: string;
    name: string;
    category: string;
    quantity: number;
  };
  const [products, setProducts] = useState<Array<data>>([]);
  useEffect(() => {
    // demo data
    const datas = [
      { code: "P100", name: "Apple", category: "Fruits", quantity: 10 },
      { code: "P101", name: "Banana", category: "Fruits", quantity: 20 },
      { code: "P102", name: "Carrot", category: "Vegetables", quantity: 15 },
      { code: "P103", name: "Broccoli", category: "Vegetables", quantity: 8 },
      { code: "P104", name: "Chicken", category: "Meat", quantity: 5 },
    ];
    setProducts(datas);
  }, []);

  return (
    <div>
      <GroupDemo />
      <BasicDemo />
      <h1 className="text-3xl font-bold underline">Hello, world!</h1>
      <Button label="Click Me" icon="pi pi-check" />
      <DataTable value={products} tableStyle={{ minWidth: "50rem" }}>
        <Column field="code" header="Code"></Column>
        <Column field="name" header="Name"></Column>
        <Column field="category" header="Category"></Column>
        <Column field="quantity" header="Quantity"></Column>
      </DataTable>
    </div>
  );
}
