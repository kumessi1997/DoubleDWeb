# CMS Admin System — Double D Media
> Kế hoạch thiết kế & triển khai hệ thống quản lý nội dung cho doubledmedia.vn

---

## 1. Tổng quan kiến trúc

### Vấn đề hiện tại
- Toàn bộ nội dung (blog, showcase, i18n, services) đang hardcode trong HTML/JS
- Mỗi lần cập nhật phải sửa trực tiếp file HTML → dễ lỗi, không có lịch sử
- Không có quy trình duyệt bài viết (draft → published)
- Không quản lý được media, form submissions

### Giải pháp đề xuất: Custom Admin Panel + Node.js API + SQLite

```
┌─────────────────────────────────────────────────────────────┐
│                    doubledmedia.vn                          │
│                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │  Static HTML │    │  /admin/     │    │  /api/       │  │
│  │  (Public)    │    │  React SPA   │    │  Node.js     │  │
│  │              │◄───│  Admin UI    │───►│  Express     │  │
│  │  fetch từ   │    │  (auth)      │    │  + SQLite    │  │
│  │  /data/*.json│    └──────────────┘    └──────┬───────┘  │
│  └──────────────┘                               │          │
│                                                 ▼          │
│                                         ┌──────────────┐   │
│                                         │  /data/*.json│   │
│                                         │  SQLite DB   │   │
│                                         │  /Img/ media │   │
│                                         └──────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Lý do chọn kiến trúc này
| Tiêu chí | Lý do |
|---|---|
| Không cần framework JS | Public pages vẫn là static HTML, chỉ thêm `fetch()` nhỏ |
| Không vendor lock-in | Tự host, tự kiểm soát data |
| Chi phí thấp | Một VPS $5-10/tháng là đủ chạy cả web lẫn API |
| Mở rộng dễ | Sau này có thể thêm Next.js hoặc migrate sang framework khác |
| Phù hợp team nhỏ | Admin solo login, không cần multi-tenant |

---

## 2. Tech Stack

| Layer | Technology | Ghi chú |
|---|---|---|
| **Backend API** | Node.js 20 + Express.js | Lightweight, no framework overhead |
| **Database** | SQLite (better-sqlite3) | Blog posts, contacts, users — đủ cho scale hiện tại |
| **Config/Content** | JSON files (`/data/`) | Showcase, translations, services, nav — dễ Git backup |
| **Auth** | JWT (access + refresh) + bcryptjs | Admin-only, không cần OAuth |
| **File upload** | Multer | Upload trực tiếp vào `/Img/` |
| **Admin UI** | React 18 + Vite + Tailwind | Dark theme khớp với website |
| **Rich text** | TipTap v2 | Editor cho blog, hỗ trợ EN/VI tabs |
| **Process manager** | PM2 | Auto-restart, log rotation |
| **Reverse proxy** | Nginx | Serve static files + proxy `/api/` |

---

## 3. Cấu trúc thư mục mới

```
DoubleDWeb-main/
│
├── [Tất cả HTML hiện tại — không thay đổi]
│
├── data/                        ← MỚI: JSON content files
│   ├── showcase.json            # Portfolio projects (từ cases object)
│   ├── en.json                  # Translations EN (từ lang.js)
│   ├── vi.json                  # Translations VI (từ lang.js)
│   ├── services.json            # Services content
│   ├── navigation.json          # Nav items (từ components.js)
│   └── settings.json            # Company info, social links
│
├── api/                         ← MỚI: Backend server
│   ├── server.js                # Entry point
│   ├── package.json
│   ├── .env                     # JWT_SECRET, PORT, ADMIN_EMAIL
│   ├── db/
│   │   ├── schema.sql
│   │   └── database.js          # SQLite connection + helpers
│   ├── routes/
│   │   ├── auth.js              # POST /login, /logout, /refresh
│   │   ├── blog.js              # CRUD blog posts
│   │   ├── showcase.js          # CRUD showcase projects
│   │   ├── translations.js      # GET/PUT translations JSON
│   │   ├── services.js          # GET/PUT services JSON
│   │   ├── media.js             # Upload/delete media
│   │   ├── contacts.js          # Read contact form submissions
│   │   └── settings.js          # GET/PUT settings JSON
│   └── middleware/
│       ├── auth.js              # JWT verify middleware
│       └── upload.js            # Multer config
│
├── admin/                       ← MỚI: Admin SPA (React build output)
│   ├── index.html
│   └── assets/
│
└── admin-src/                   ← MỚI: Admin source (Vite + React)
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── api/                 # API client functions
        ├── components/          # Shared UI components
        └── pages/
            ├── Login.jsx
            ├── Dashboard.jsx
            ├── Blog/            # List + Editor
            ├── Showcase/        # List + Editor
            ├── Translations/    # EN/VI side-by-side editor
            ├── Media/           # Grid + upload
            ├── Services/        # Content editor
            ├── Contacts/        # Inbox
            └── Settings/        # Company settings
```

---

## 4. Database Schema (SQLite)

```sql
-- Bảng blog posts
CREATE TABLE posts (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  slug          TEXT UNIQUE NOT NULL,
  title_en      TEXT,
  title_vi      TEXT,
  content_en    TEXT,   -- HTML từ TipTap
  content_vi    TEXT,
  excerpt_en    TEXT,
  excerpt_vi    TEXT,
  thumbnail     TEXT,   -- filename trong /Img/
  category      TEXT,   -- 'motion' | 'interactive' | 'uiux' | 'news'
  tags          TEXT,   -- JSON array: ["rive","animation"]
  status        TEXT DEFAULT 'draft',  -- 'draft' | 'published'
  author        TEXT DEFAULT 'Double D Media',
  meta_desc_en  TEXT,
  meta_desc_vi  TEXT,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  published_at  DATETIME
);

-- Bảng media
CREATE TABLE media (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  filename      TEXT NOT NULL,
  original_name TEXT,
  mime_type     TEXT,
  size_bytes    INTEGER,
  width         INTEGER,
  height        INTEGER,
  alt_text      TEXT,
  uploaded_at   DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Bảng contact form submissions
CREATE TABLE contacts (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT,
  email         TEXT,
  phone         TEXT,
  service       TEXT,
  message       TEXT,
  status        TEXT DEFAULT 'unread',  -- 'unread' | 'read' | 'replied'
  ip            TEXT,
  submitted_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Bảng admin users
CREATE TABLE users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name          TEXT,
  role          TEXT DEFAULT 'admin',
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login    DATETIME
);
```

---

## 5. API Endpoints

```
── AUTH ────────────────────────────────────────────────────────
POST   /api/auth/login              { email, password } → { token, refreshToken }
POST   /api/auth/logout
POST   /api/auth/refresh            { refreshToken } → { token }
GET    /api/auth/me

── BLOG ────────────────────────────────────────────────────────
GET    /api/blog                    ?page=1&limit=10&status=all|draft|published
POST   /api/blog                    Tạo bài viết mới
GET    /api/blog/:id
PUT    /api/blog/:id                Cập nhật
DELETE /api/blog/:id
PUT    /api/blog/:id/publish        Draft → Published
PUT    /api/blog/:id/unpublish      Published → Draft

── SHOWCASE ────────────────────────────────────────────────────
GET    /api/showcase                Danh sách tất cả
POST   /api/showcase                Tạo project mới
GET    /api/showcase/:id
PUT    /api/showcase/:id
DELETE /api/showcase/:id
PUT    /api/showcase/reorder        { order: [id, id, id] }

── TRANSLATIONS ────────────────────────────────────────────────
GET    /api/translations            { en: {...}, vi: {...} }
PUT    /api/translations            Ghi đè data/en.json + vi.json

── SERVICES ────────────────────────────────────────────────────
GET    /api/services
PUT    /api/services                Ghi đè data/services.json

── MEDIA ───────────────────────────────────────────────────────
GET    /api/media                   ?page=1&limit=24
POST   /api/media/upload            multipart/form-data
DELETE /api/media/:id
PUT    /api/media/:id               { alt_text }

── CONTACTS ────────────────────────────────────────────────────
GET    /api/contacts                ?page=1&status=unread
PUT    /api/contacts/:id/status     { status: 'read' | 'replied' }
DELETE /api/contacts/:id

── SETTINGS ────────────────────────────────────────────────────
GET    /api/settings
PUT    /api/settings                Ghi đè data/settings.json
```

---

## 6. Màn hình Admin UI

### 6.1 Login (`/admin/login`)
- Form email + password
- JWT token lưu vào memory (không localStorage vì bảo mật)
- Refresh token trong httpOnly cookie

### 6.2 Dashboard (`/admin/`)
```
┌─────────────────────────────────────────────────────────┐
│  📊 Dashboard                                           │
│                                                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │ 12 Posts │ │ 4 Proj.  │ │ 8 Media  │ │ 3 Inbox  │  │
│  │ 3 draft  │ │ showcase │ │ uploaded │ │ unread   │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│                                                         │
│  Recent Posts          Recent Contacts                  │
│  ─────────────         ───────────────                  │
│  • Rive Tutorial  ✏️   • Nguyen Van A (hôm nay)        │
│  • KiotViet case  ✏️   • Tran Thi B (hôm qua)         │
└─────────────────────────────────────────────────────────┘
```

### 6.3 Blog Manager (`/admin/blog`)
- Danh sách bài viết: thumbnail, tiêu đề, ngày, trạng thái (Draft/Published)
- Filter theo category, status
- Quick actions: Edit, Publish/Unpublish, Delete
- Nút "+ New Post"

### 6.4 Blog Editor (`/admin/blog/:id/edit`)
```
┌─────────────────────────────────────────────────────────┐
│  ← Back   Blog Editor              [Save Draft] [Publish]│
│                                                         │
│  Title:  [___________________________________]          │
│                                                         │
│  [🇬🇧 English]  [🇻🇳 Tiếng Việt]   ← Tab switch       │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  TipTap Rich Text Editor                        │   │
│  │  H1 H2 H3 | B I U | Link Img | Code | ...      │   │
│  │  ─────────────────────────────────────────────  │   │
│  │  [Nội dung bài viết...]                         │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Thumbnail: [Upload]  Category: [▼]  Tags: [input]     │
│  Meta Description: [____________________________]       │
│  Slug: /blog/ten-bai-viet                               │
└─────────────────────────────────────────────────────────┘
```

### 6.5 Showcase Manager (`/admin/showcase`)
- Grid card view của các projects
- Kéo-thả để sắp xếp thứ tự hiển thị
- Edit modal: client, title, industry, services, timeline, KPI, hero image/Rive, challenge, solution, result

### 6.6 Translations Editor (`/admin/translations`)
```
┌─────────────────────────────────────────────────────────┐
│  🌐 Translations                    [Save All Changes]  │
│                                                         │
│  Filter: [________]  Section: [All ▼]                  │
│                                                         │
│  Key                  English              Tiếng Việt   │
│  ─────────────────────────────────────────────────────  │
│  nav.home             [Home           ]   [Trang chủ  ] │
│  nav.services         [Our Services   ]   [Dịch vụ    ] │
│  hero.marquee.1       [AT DOUBLE D... ]   [TẠI DOUBLE ] │
│  ...                                                    │
└─────────────────────────────────────────────────────────┘
```

### 6.7 Media Library (`/admin/media`)
- Grid view tất cả ảnh trong `/Img/`
- Upload kéo-thả
- Click để copy URL
- Alt text editor
- Filter theo type (image/video)

### 6.8 Contacts Inbox (`/admin/contacts`)
- List view như email inbox
- Unread badge
- Click để xem full message
- Mark as read / replied
- Export CSV

### 6.9 Settings (`/admin/settings`)
- Thông tin công ty (tên, email, phone, địa chỉ)
- Social links
- Đổi mật khẩu admin
- Google Analytics ID

---

## 7. Thay đổi trên Frontend (Public Pages)

Để admin có thể cập nhật nội dung mà không cần sửa HTML, cần thay đổi các file sau:

### 7.1 `showcase.html` — fetch từ JSON
```js
// Thay const cases = { ... } bằng:
async function loadCases() {
  const res = await fetch('/data/showcase.json');
  const cases = await res.json();
  // render cards + wire openCase()
}
```

### 7.2 `lang.js` — fetch từ JSON files
```js
// Thay TRANSLATIONS hardcode bằng:
async function loadTranslations() {
  const [en, vi] = await Promise.all([
    fetch('/data/en.json').then(r => r.json()),
    fetch('/data/vi.json').then(r => r.json())
  ]);
  window.TRANSLATIONS = { en, vi };
  applyTranslations();
}
```

### 7.3 `blog.html` — fetch danh sách bài viết
```js
// Thay hardcode article links bằng:
fetch('/api/blog?status=published&limit=10')
  .then(r => r.json())
  .then(posts => renderBlogCards(posts));
```

### 7.4 Blog post pages — dùng template + fetch content
- Tạo `blog-post.html` là template chung
- URL pattern: `blog-post.html?slug=ten-bai-viet`
- Page fetch `/api/blog?slug=...` và render nội dung
- Giữ nguyên các file HTML cũ (backward compat)

### 7.5 `contact-us.html` — gửi form về API
```js
// Thay mailto/formspree bằng:
fetch('/api/contacts', {
  method: 'POST',
  body: JSON.stringify(formData)
});
```

---

## 8. Kế hoạch triển khai theo Phase

### Phase 0 — Content Migration (2–3 ngày)
> Không có UI, chỉ di chuyển data từ HTML/JS ra JSON files

- [ ] Tạo `data/showcase.json` từ `cases` object trong showcase.html
- [ ] Tạo `data/en.json` + `data/vi.json` từ `lang.js`
- [ ] Tạo `data/services.json` từ our-services.html
- [ ] Tạo `data/settings.json` (company info)
- [ ] Cập nhật `showcase.html` fetch từ JSON
- [ ] Cập nhật `lang.js` fetch từ JSON
- [ ] Test tất cả pages vẫn hiển thị đúng

**Deliverable:** Site hoạt động bình thường, nội dung đã tách ra JSON

---

### Phase 1 — Backend API (4–5 ngày)
> Node.js server, không có UI

- [ ] Khởi tạo `api/package.json` (express, better-sqlite3, bcryptjs, jsonwebtoken, multer, cors)
- [ ] Schema SQLite + migration script
- [ ] Auth routes (login, logout, refresh, me)
- [ ] Blog CRUD routes
- [ ] Showcase CRUD routes (đọc/ghi `data/showcase.json`)
- [ ] Translations routes (đọc/ghi `data/en.json`, `data/vi.json`)
- [ ] Media upload/delete routes
- [ ] Contacts routes
- [ ] Settings routes
- [ ] Test tất cả endpoints với Postman/curl

**Deliverable:** API server chạy được, tất cả endpoints hoạt động

---

### Phase 2 — Admin UI Core (5–6 ngày)
> Giao diện quản trị phần quan trọng nhất

- [ ] Khởi tạo `admin-src/` (Vite + React + Tailwind dark theme)
- [ ] API client module (axios + auto-refresh token)
- [ ] Layout component (sidebar, header, breadcrumb)
- [ ] Trang Login
- [ ] Dashboard (stats cards + recent items)
- [ ] Blog List page (table với pagination, filter)
- [ ] Blog Editor (TipTap, EN/VI tabs, thumbnail picker, meta fields)
- [ ] Media Library (grid, upload dropzone, copy URL)
- [ ] Build script → output vào `admin/`

**Deliverable:** Có thể đăng nhập và quản lý blog posts + media

---

### Phase 3 — Admin UI Extended (4–5 ngày)
> Các module còn lại

- [ ] Showcase Manager (list, drag-to-reorder, editor modal)
- [ ] Translations Editor (table, inline edit EN/VI, search/filter by key)
- [ ] Services Editor (rich text per service section)
- [ ] Contacts Inbox (list, read/replied status)
- [ ] Settings page
- [ ] Đổi mật khẩu

**Deliverable:** Admin UI hoàn chỉnh tất cả tính năng

---

### Phase 4 — Deploy & Integration (2–3 ngày)
> Đưa lên server thật

- [ ] Cấu hình Nginx (serve static files + proxy `/api/` → Node.js)
- [ ] PM2 config cho Node.js server
- [ ] SSL certificate (Let's Encrypt)
- [ ] Cấu hình `.env` production
- [ ] Setup backup SQLite database (cron job)
- [ ] Test toàn bộ flow từ đầu đến cuối
- [ ] Seed admin user đầu tiên

**Deliverable:** Hệ thống live, admin có thể đăng nhập và quản lý nội dung

---

## 9. Ước tính effort

| Phase | Công việc | Thời gian |
|---|---|---|
| Phase 0 | Content migration | 2–3 ngày |
| Phase 1 | Backend API | 4–5 ngày |
| Phase 2 | Admin UI Core | 5–6 ngày |
| Phase 3 | Admin UI Extended | 4–5 ngày |
| Phase 4 | Deploy | 2–3 ngày |
| **Tổng** | | **17–22 ngày** |

*Ước tính cho 1 developer full-time. Có thể giảm xuống ~10 ngày nếu dùng thêm template UI có sẵn.*

---

## 10. Rủi ro & Giải pháp

| Rủi ro | Giải pháp |
|---|---|
| Pages load chậm hơn vì phải fetch JSON | Dùng `Cache-Control` headers cho `/data/*.json`. Thêm loading skeleton. |
| SQLite không đủ cho scale lớn | Dễ migrate sang PostgreSQL sau vì đã tách API layer |
| Admin bị hack | Rate limit login, HTTPS only, httpOnly cookie cho refresh token |
| Mất data khi server crash | Backup SQLite mỗi ngày, JSON files đã có trong Git |
| Blog post cũ (HTML files) bị orphaned | Giữ nguyên các file HTML cũ, chỉ thêm blog-post.html template cho bài mới |

---

## 11. Thứ tự ưu tiên nếu muốn triển khai nhanh

Nếu chỉ có 1 tuần, làm theo thứ tự:
1. **Phase 0** — Di chuyển data ra JSON (critical)
2. **Phase 1** — Backend API (critical)
3. **Blog Editor + Media Library** (giá trị cao nhất)
4. **Contacts Inbox** (nhu cầu thực tế)
5. Phần còn lại của Phase 3 sau

---

*Tài liệu này là roadmap — có thể điều chỉnh scope từng phase tùy timeline thực tế.*
