import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createAdminCategory,
  createAdminProduct,
  deleteAdminCategory,
  deleteAdminProduct,
  getAdminCategories,
  getAdminOrders,
  getAdminProducts,
  getSalesReport,
  updateAdminOrderStatus,
  updateAdminProduct,
} from "../../services/api";
import "./Admin.css";

const defaultProductForm = {
  name: "",
  category: "",
  price: "",
  stock: "",
  description: "",
};

const defaultCategoryForm = {
  name: "",
  description: "",
};

const statusOptions = ["Processing", "Out for Delivery", "Delivered"];
const PRODUCT_IMAGE_SIZE = 600;
const adminTabs = [
  { id: "sales", label: "Sales Dashboard" },
  { id: "categories", label: "Manage Categories" },
  { id: "products", label: "Fruits & Inventory" },
  { id: "orders", label: "Orders" },
];

function Admin() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [report, setReport] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    deliveredRevenue: 0,
    todayRevenue: 0,
    monthRevenue: 0,
    statusBreakdown: [],
    dailySales: [],
    topProducts: [],
  });

  const [productForm, setProductForm] = useState(defaultProductForm);
  const [productImageFile, setProductImageFile] = useState(null);
  const [productImagePreviewUrl, setProductImagePreviewUrl] = useState("");
  const [productImageElement, setProductImageElement] = useState(null);
  const [cropZoom, setCropZoom] = useState(1);
  const [cropX, setCropX] = useState(0);
  const [cropY, setCropY] = useState(0);
  const [categoryForm, setCategoryForm] = useState(defaultCategoryForm);
  const [editingProductId, setEditingProductId] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("sales");

  const categoryNames = useMemo(
    () =>
      Array.from(
        new Set([
          ...categories.map((category) => category.name),
          ...products.map((product) => product.category).filter(Boolean),
        ])
      ),
    [categories, products]
  );

  const loadAdminData = async () => {
    setLoading(true);
    setError("");
    try {
      const [productsData, categoriesData, ordersData, reportData] = await Promise.all([
        getAdminProducts(),
        getAdminCategories(),
        getAdminOrders(),
        getSalesReport(),
      ]);

      setProducts(productsData);
      setCategories(categoriesData);
      setOrders(ordersData);
      setReport(reportData);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  useEffect(() => {
    return () => {
      if (productImagePreviewUrl) {
        URL.revokeObjectURL(productImagePreviewUrl);
      }
    };
  }, [productImagePreviewUrl]);

  const getCropArea = (img, zoom, panX, panY) => {
    const width = img.naturalWidth || img.width;
    const height = img.naturalHeight || img.height;
    const minSide = Math.min(width, height);
    const sourceSize = minSide / zoom;

    const baseX = (width - sourceSize) / 2;
    const baseY = (height - sourceSize) / 2;
    const maxShiftX = (width - sourceSize) / 2;
    const maxShiftY = (height - sourceSize) / 2;

    const sx = Math.max(0, Math.min(baseX + panX * maxShiftX, width - sourceSize));
    const sy = Math.max(0, Math.min(baseY + panY * maxShiftY, height - sourceSize));

    return { sx, sy, sourceSize };
  };

  const exportCroppedImageFile = async () => {
    if (!productImageFile || !productImageElement) return null;

    const canvas = document.createElement("canvas");
    canvas.width = PRODUCT_IMAGE_SIZE;
    canvas.height = PRODUCT_IMAGE_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const panX = cropX / 100;
    const panY = cropY / 100;
    const { sx, sy, sourceSize } = getCropArea(productImageElement, cropZoom, panX, panY);

    ctx.drawImage(
      productImageElement,
      sx,
      sy,
      sourceSize,
      sourceSize,
      0,
      0,
      PRODUCT_IMAGE_SIZE,
      PRODUCT_IMAGE_SIZE
    );

    const blob = await new Promise((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", 0.92);
    });

    if (!blob) return null;
    return new File([blob], `${Date.now()}-product.jpg`, { type: "image/jpeg" });
  };

  const handleProductChange = (event) => {
    const { name, value } = event.target;
    setProductForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCategoryChange = (event) => {
    const { name, value } = event.target;
    setCategoryForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleProductSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const payload = {
        ...productForm,
      };

      const formData = new FormData();
      formData.append("name", payload.name);
      formData.append("category", payload.category);
      formData.append("price", String(Number(payload.price) || 0));
      formData.append("stock", String(Number(payload.stock) || 0));
      formData.append("description", payload.description || "");
      const croppedImageFile = await exportCroppedImageFile();
      if (croppedImageFile) {
        formData.append("image", croppedImageFile);
      }

      if (editingProductId) {
        await updateAdminProduct(editingProductId, formData);
      } else {
        await createAdminProduct(formData);
      }

      setEditingProductId("");
      setProductForm(defaultProductForm);
      setProductImageFile(null);
      setProductImageElement(null);
      setCropZoom(1);
      setCropX(0);
      setCropY(0);
      if (productImagePreviewUrl) {
        URL.revokeObjectURL(productImagePreviewUrl);
        setProductImagePreviewUrl("");
      }
      await loadAdminData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save product");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCategorySubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await createAdminCategory(categoryForm);
      setCategoryForm(defaultCategoryForm);
      await loadAdminData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save category");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditProduct = (product) => {
    setEditingProductId(product._id);
    setProductForm({
      name: product.name || "",
      category: product.category || "",
      price: product.price ?? "",
      stock: product.stock ?? "",
      description: product.description || "",
    });
    setProductImageFile(null);
    setProductImageElement(null);
    setCropZoom(1);
    setCropX(0);
    setCropY(0);
    if (productImagePreviewUrl) {
      URL.revokeObjectURL(productImagePreviewUrl);
      setProductImagePreviewUrl("");
    }
  };

  const handleDeleteProduct = async (id) => {
    try {
      await deleteAdminProduct(id);
      await loadAdminData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete product");
    }
  };

  const handleDeleteCategory = async (id) => {
    try {
      await deleteAdminCategory(id);
      await loadAdminData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete category");
    }
  };

  const handleStatusUpdate = async (orderId, status) => {
    try {
      await updateAdminOrderStatus(orderId, status);
      await loadAdminData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update order status");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  if (loading) {
    return <div className="admin-loading">Loading admin dashboard...</div>;
  }

  return (
    <div className="admin-page">
      <header className="admin-topbar">
        <h1 className="admin-title">Admin Dashboard</h1>
        <div className="admin-auth-actions">
          <button type="button" className="admin-logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      {error ? <p className="admin-error">{error}</p> : null}

      <nav className="admin-tabs" aria-label="Admin functionality tabs">
        {adminTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`admin-tab-btn ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === "sales" ? (
        <section className="admin-section">
          <h2>Sales Dashboard</h2>
          <section className="admin-cards">
            <article className="admin-card">
              <h3>Total Orders</h3>
              <p>{report.totalOrders}</p>
            </article>
            <article className="admin-card">
              <h3>Total Sales</h3>
              <p>₹ {report.totalRevenue}</p>
            </article>
            <article className="admin-card">
              <h3>Delivered Revenue</h3>
              <p>₹ {report.deliveredRevenue}</p>
            </article>
            <article className="admin-card">
              <h3>Today Sales</h3>
              <p>₹ {report.todayRevenue}</p>
            </article>
            <article className="admin-card">
              <h3>This Month Sales</h3>
              <p>₹ {report.monthRevenue}</p>
            </article>
          </section>

          <h3 className="admin-subheading">Status Breakdown</h3>
          <div className="admin-list">
            {report.statusBreakdown.length ? (
              report.statusBreakdown.map((entry) => (
                <div key={entry._id} className="admin-list-row">
                  <strong>{entry._id}</strong>
                  <p>{entry.count} orders</p>
                </div>
              ))
            ) : (
              <p>No order status data yet.</p>
            )}
          </div>

          <h3 className="admin-subheading">Last 7 Days Sales</h3>
          <div className="admin-list">
            {report.dailySales.length ? (
              report.dailySales.map((entry) => (
                <div key={entry.date} className="admin-list-row">
                  <strong>{entry.date}</strong>
                  <p>₹ {entry.revenue}</p>
                </div>
              ))
            ) : (
              <p>No recent sales data yet.</p>
            )}
          </div>

          <h3 className="admin-subheading">Top Selling Fruits</h3>
          <div className="admin-list">
            {report.topProducts.length ? (
              report.topProducts.map((entry) => (
                <div key={entry.name} className="admin-list-row">
                  <strong>{entry.name}</strong>
                  <p>{entry.units} units sold</p>
                </div>
              ))
            ) : (
              <p>No product sales data yet.</p>
            )}
          </div>
        </section>
      ) : null}

      {activeTab === "categories" ? (
        <section className="admin-section">
          <h2>Manage Categories</h2>
          <form className="admin-form" onSubmit={handleCategorySubmit}>
            <input
              type="text"
              name="name"
              placeholder="Category name"
              value={categoryForm.name}
              onChange={handleCategoryChange}
              required
            />
            <input
              type="text"
              name="description"
              placeholder="Description"
              value={categoryForm.description}
              onChange={handleCategoryChange}
            />
            <button type="submit" disabled={submitting}>
              Add Category
            </button>
          </form>

          <div className="category-table-wrap">
            <table className="category-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category._id}>
                    <td>{category.name}</td>
                    <td>{category.description || "-"}</td>
                    <td>
                      <button
                        type="button"
                        className="category-cross-btn"
                        title="Delete"
                        aria-label={`Delete ${category.name}`}
                        onClick={() => handleDeleteCategory(category._id)}
                      >
                        <img src="/cross.svg" alt="" aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {activeTab === "products" ? (
        <section className="admin-section">
          <h2>Add / Edit / Delete Fruits & Inventory Stock</h2>
          <form className="admin-form grid" onSubmit={handleProductSubmit}>
            <input
              type="text"
              name="name"
              placeholder="Fruit name"
              value={productForm.name}
              onChange={handleProductChange}
              required
            />
            <select name="category" value={productForm.category} onChange={handleProductChange} required>
              <option value="">Select category</option>
              {categoryNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <input
              type="number"
              name="price"
              placeholder="Price per kg"
              value={productForm.price}
              onChange={handleProductChange}
              min="0"
              required
            />
            <input
              type="number"
              name="stock"
              placeholder="Stock quantity"
              value={productForm.stock}
              onChange={handleProductChange}
              min="0"
              required
            />
            <input
              type="file"
              name="image"
              accept="image/*"
              required={!editingProductId}
              onChange={(event) => {
                const file = event.target.files?.[0] || null;
                setProductImageFile(file);

                if (productImagePreviewUrl) {
                  URL.revokeObjectURL(productImagePreviewUrl);
                  setProductImagePreviewUrl("");
                }

                if (!file) {
                  setProductImageElement(null);
                  return;
                }

                const previewUrl = URL.createObjectURL(file);
                setProductImagePreviewUrl(previewUrl);
                setCropZoom(1);
                setCropX(0);
                setCropY(0);

                const image = new Image();
                image.onload = () => setProductImageElement(image);
                image.src = previewUrl;
              }}
            />
            <textarea
              name="description"
              placeholder="Description"
              value={productForm.description}
              onChange={handleProductChange}
            />
            <button type="submit" disabled={submitting}>
              {editingProductId ? "Update Fruit" : "Add Fruit"}
            </button>
          </form>

          {productImagePreviewUrl && productImageElement ? (
            <div className="cropper-box">
              <div className="crop-preview-wrap">
                <div className="crop-preview-frame">
                  <img
                    src={productImagePreviewUrl}
                    alt="Crop preview"
                    style={{
                      transform: `translate(${cropX}%, ${cropY}%) scale(${cropZoom})`,
                    }}
                  />
                </div>
              </div>

              <div className="crop-controls">
                <p>
                  Crop output size: <strong>{PRODUCT_IMAGE_SIZE} x {PRODUCT_IMAGE_SIZE}px</strong>
                </p>
                <label>
                  Zoom
                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="0.01"
                    value={cropZoom}
                    onChange={(event) => setCropZoom(Number(event.target.value))}
                  />
                </label>
                <label>
                  Horizontal
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    step="1"
                    value={cropX}
                    onChange={(event) => setCropX(Number(event.target.value))}
                  />
                </label>
                <label>
                  Vertical
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    step="1"
                    value={cropY}
                    onChange={(event) => setCropY(Number(event.target.value))}
                  />
                </label>
              </div>
            </div>
          ) : null}

          <div className="admin-list">
            {products.map((product) => (
              <div key={product._id} className="admin-list-row">
                <div className="admin-product-main">
                  <img
                    src={product.image || "/logo.svg"}
                    alt={product.name}
                    className="admin-product-image"
                  />
                  <div>
                    <strong>{product.name}</strong>
                    <p>
                      {product.category} | ₹ {product.price}/kg | Stock: {product.stock}
                    </p>
                  </div>
                </div>
                <div className="admin-row-actions">
                  <button type="button" onClick={() => handleEditProduct(product)}>
                    Edit
                  </button>
                  <button type="button" className="danger" onClick={() => handleDeleteProduct(product._id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {activeTab === "orders" ? (
        <section className="admin-section">
          <h2>View Orders & Update Status</h2>
          <div className="admin-list">
            {orders.map((order) => (
              <div key={order._id} className="admin-list-row">
                <div>
                  <strong>Order #{order._id.slice(-6)}</strong>
                  <p>
                    Customer: {order.user?.name || "Unknown"} | Total: ₹ {order.totalAmount} | Status:{" "}
                    {order.status}
                  </p>
                </div>
                <div className="admin-row-actions">
                  <select
                    defaultValue={order.status}
                    onChange={(event) => handleStatusUpdate(order._id, event.target.value)}
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

export default Admin;
