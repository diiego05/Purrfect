CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    avatar_url VARCHAR(500),
    bio TEXT,
    role VARCHAR(50) NOT NULL DEFAULT 'STUDENT', -- STUDENT, INSTRUCTOR, ADMIN
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- PENDING, ACTIVE, BLOCKED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng 2: Mã xác thực OTP (otp_codes)
CREATE TABLE otp_codes (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    code VARCHAR(10) NOT NULL,
    type VARCHAR(50) NOT NULL, -- REGISTER, RESET_PASSWORD
    is_used BOOLEAN DEFAULT FALSE,
    expired_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Bảng 3: Thông tin định hướng ban đầu (onboarding_surveys)
CREATE TABLE onboarding_surveys (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    interested_category_ids JSON,
    interested_skill_ids JSON,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Bảng 4: Yêu cầu trở thành giảng viên (instructor_applications)
CREATE TABLE instructor_applications (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
    bank_account_info TEXT NOT NULL,
    note TEXT,
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_by VARCHAR(36),
    reviewed_at TIMESTAMP,
    reject_reason TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (reviewed_by) REFERENCES users(id)
);

-- Bảng 30: Banner quảng cáo (banners)
CREATE TABLE banners (
    id VARCHAR(36) PRIMARY KEY,
    image_url VARCHAR(500) NOT NULL,
    title VARCHAR(255),
    link_url VARCHAR(500),
    order_index INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

-- Bảng 31: Cấu hình hệ thống (system_configs)
CREATE TABLE system_configs (
    id VARCHAR(36) PRIMARY KEY,
    key_name VARCHAR(100) UNIQUE NOT NULL,
    value_text TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng 32: Hạn mức AI (ai_quotas)
CREATE TABLE ai_quotas (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    month_year VARCHAR(7) NOT NULL, -- YYYY-MM
    ai_chat_used INT DEFAULT 0,
    ai_quiz_gen_used INT DEFAULT 0,
    ai_chat_limit INT DEFAULT 100,
    ai_quiz_gen_limit INT DEFAULT 20,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Bảng 33: Nhật ký kiểm toán (audit_logs)
CREATE TABLE audit_logs (
    id VARCHAR(36) PRIMARY KEY,
    admin_id VARCHAR(36) NOT NULL,
    action VARCHAR(255) NOT NULL,
    target_type VARCHAR(100) NOT NULL,
    target_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES users(id)
);

-- Bảng 34: Báo cáo nội dung (content_reports)
CREATE TABLE content_reports (
    id VARCHAR(36) PRIMARY KEY,
    reported_by VARCHAR(36) NOT NULL,
    target_type VARCHAR(50) NOT NULL, -- DISCUSSION, REVIEW, LECTURE
    target_id VARCHAR(36) NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, RESOLVED, DISMISSED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reported_by) REFERENCES users(id)
);

-- ==========================================
-- 2. MODULE HỌC LIỆU (COURSE MODULE)
-- ==========================================

-- Bảng 5: Danh mục khóa học (categories)
CREATE TABLE categories (
    id VARCHAR(36) PRIMARY KEY,
    category_name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    parent_id VARCHAR(36),
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Bảng 7: Kỹ năng (skills)
CREATE TABLE skills (
    id VARCHAR(36) PRIMARY KEY,
    skill_name VARCHAR(255) NOT NULL,
    category_id VARCHAR(36) NOT NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- Bảng 6: Khóa học (courses)
CREATE TABLE courses (
    id VARCHAR(36) PRIMARY KEY,
    instructor_id VARCHAR(36),
    category_id VARCHAR(36),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    short_description TEXT,
    thumbnail_url VARCHAR(500),
    badge VARCHAR(50), -- NEW, BESTSELLER, HOT
    duration_hours INT DEFAULT 0,
    duration_text VARCHAR(50), -- e.g. '20h'
    price DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    discount_price DECIMAL(12, 2) DEFAULT 0.00,
    status VARCHAR(50) NOT NULL DEFAULT 'PUBLISHED', -- DRAFT, PENDING_APPROVAL, PUBLISHED, REJECTED, DISABLED
    average_rating DECIMAL(3, 2) DEFAULT 0.00,
    total_students INT DEFAULT 0,
    is_for_you BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (instructor_id) REFERENCES users(id),
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Bảng 8: Chương học (modules)
CREATE TABLE modules (
    id VARCHAR(36) PRIMARY KEY,
    course_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    order_index INT NOT NULL DEFAULT 1,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- Bảng 9: Bài giảng (lectures)
CREATE TABLE lectures (
    id VARCHAR(36) PRIMARY KEY,
    module_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- VIDEO, DOCUMENT, QUIZ
    video_url VARCHAR(500),
    duration INT DEFAULT 0, -- theo giây
    is_free_preview BOOLEAN DEFAULT FALSE,
    transcript_text TEXT,
    FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
);

-- Bảng 24: Danh sách phát (playlists)
CREATE TABLE playlists (
    id VARCHAR(36) PRIMARY KEY,
    owner_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    is_public BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Bảng 25: Khóa học trong danh sách phát (playlist_courses)
CREATE TABLE playlist_courses (
    id VARCHAR(36) PRIMARY KEY,
    playlist_id VARCHAR(36) NOT NULL,
    course_id VARCHAR(36) NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- ==========================================
-- 3. MODULE HỌC TẬP (LEARNING MODULE)
-- ==========================================

-- Bảng 20: Ghi danh khóa học (enrollments)
CREATE TABLE enrollments (
    id VARCHAR(36) PRIMARY KEY,
    student_id VARCHAR(36) NOT NULL,
    course_id VARCHAR(36) NOT NULL,
    progress_percent DECIMAL(5, 2) DEFAULT 0.00,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (course_id) REFERENCES courses(id)
);

-- Bảng 21: Tiến độ học tập (lecture_progress)
CREATE TABLE lecture_progress (
    id VARCHAR(36) PRIMARY KEY,
    enrollment_id VARCHAR(36) NOT NULL,
    lecture_id VARCHAR(36) NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    last_watched_second INT DEFAULT 0,
    FOREIGN KEY (enrollment_id) REFERENCES enrollments(id) ON DELETE CASCADE,
    FOREIGN KEY (lecture_id) REFERENCES lectures(id) ON DELETE CASCADE
);

-- Bảng 22: Ghi chú bài giảng (lecture_notes)
CREATE TABLE lecture_notes (
    id VARCHAR(36) PRIMARY KEY,
    student_id VARCHAR(36) NOT NULL,
    lecture_id VARCHAR(36) NOT NULL,
    content TEXT NOT NULL,
    timestamp_sec INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (lecture_id) REFERENCES lectures(id) ON DELETE CASCADE
);

-- Bảng 23: Chứng chỉ (certificates)
CREATE TABLE certificates (
    id VARCHAR(36) PRIMARY KEY,
    enrollment_id VARCHAR(36) UNIQUE NOT NULL,
    verification_uuid VARCHAR(100) UNIQUE NOT NULL,
    pdf_url VARCHAR(500) NOT NULL,
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (enrollment_id) REFERENCES enrollments(id) ON DELETE CASCADE
);

-- Bảng 26: Đánh giá khóa học (course_reviews)
CREATE TABLE course_reviews (
    id VARCHAR(36) PRIMARY KEY,
    course_id VARCHAR(36) NOT NULL,
    student_id VARCHAR(36) NOT NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    instructor_reply TEXT,
    replied_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id),
    FOREIGN KEY (student_id) REFERENCES users(id)
);

-- Bảng 27: Thảo luận khóa học (lecture_discussions)
CREATE TABLE lecture_discussions (
    id VARCHAR(36) PRIMARY KEY,
    course_id VARCHAR(36) NOT NULL,
    lecture_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    parent_id VARCHAR(36),
    content TEXT NOT NULL,
    upvote_count INT DEFAULT 0,
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id),
    FOREIGN KEY (lecture_id) REFERENCES lectures(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (parent_id) REFERENCES lecture_discussions(id) ON DELETE CASCADE
);

-- Bảng 28: Bài kiểm tra (quizzes)
CREATE TABLE quizzes (
    id VARCHAR(36) PRIMARY KEY,
    lecture_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    questions_json JSON NOT NULL,
    FOREIGN KEY (lecture_id) REFERENCES lectures(id) ON DELETE CASCADE
);

-- Bảng 29: Kết quả bài kiểm tra (quiz_results)
CREATE TABLE quiz_results (
    id VARCHAR(36) PRIMARY KEY,
    quiz_id VARCHAR(36) NOT NULL,
    student_id VARCHAR(36) NOT NULL,
    status VARCHAR(50) DEFAULT 'SUBMITTED', -- SUBMITTED, GRADED
    total_score DECIMAL(5, 2) DEFAULT 0.00,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    graded_at TIMESTAMP,
    graded_by VARCHAR(36),
    answers_json JSON NOT NULL,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id),
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (graded_by) REFERENCES users(id)
);

-- ==========================================
-- 4. MODULE TÀI CHÍNH & GIAO DỊCH (FINANCE MODULE)
-- ==========================================

-- Bảng 10: Chi tiết giỏ hàng (cart_items)
CREATE TABLE cart_items (
    id VARCHAR(36) PRIMARY KEY,
    student_id VARCHAR(36) NOT NULL,
    course_id VARCHAR(36) NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- Bảng 11: Mã giảm giá (coupons)
CREATE TABLE coupons (
    id VARCHAR(36) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    discount_type VARCHAR(50) NOT NULL, -- PERCENT, FIXED_AMOUNT
    discount_value DECIMAL(12, 2) NOT NULL,
    max_discount_amount DECIMAL(12, 2),
    min_order_amount DECIMAL(12, 2) DEFAULT 0.00,
    total_usage_limit INT DEFAULT 100,
    used_count INT DEFAULT 0,
    valid_from TIMESTAMP NOT NULL,
    valid_to TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

-- Bảng 12: Đơn hàng (orders)
CREATE TABLE orders (
    id VARCHAR(36) PRIMARY KEY,
    student_id VARCHAR(36) NOT NULL,
    coupon_id VARCHAR(36),
    total_amount DECIMAL(12, 2) NOT NULL,
    payment_status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, PAID, FAILED, CANCELED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (coupon_id) REFERENCES coupons(id)
);

-- Bảng 13: Chi tiết đơn hàng (order_items)
CREATE TABLE order_items (
    id VARCHAR(36) PRIMARY KEY,
    order_id VARCHAR(36) NOT NULL,
    course_id VARCHAR(36) NOT NULL,
    instructor_id VARCHAR(36) NOT NULL,
    price_at_purchase DECIMAL(12, 2) NOT NULL,
    platform_fee_rate DECIMAL(5, 2) NOT NULL,
    instructor_earnings DECIMAL(12, 2) NOT NULL,
    revenue_status VARCHAR(50) DEFAULT 'HOLDING', -- HOLDING, RECOGNIZED, REFUNDED
    purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revenue_recognized_at TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id),
    FOREIGN KEY (instructor_id) REFERENCES users(id)
);

-- Bảng 14: Thanh toán (payments)
CREATE TABLE payments (
    id VARCHAR(36) PRIMARY KEY,
    order_id VARCHAR(36) NOT NULL,
    provider VARCHAR(50) NOT NULL, -- STRIPE, VNPAY, MOMO
    transaction_code VARCHAR(255),
    ipn_status VARCHAR(50) DEFAULT 'PENDING',
    amount DECIMAL(12, 2) NOT NULL,
    paid_at TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- Bảng 15: Hóa đơn (invoices)
CREATE TABLE invoices (
    id VARCHAR(36) PRIMARY KEY,
    order_id VARCHAR(36) UNIQUE NOT NULL,
    student_id VARCHAR(36) NOT NULL,
    pdf_url VARCHAR(500) NOT NULL,
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (student_id) REFERENCES users(id)
);

-- Bảng 16: Ví giảng viên (wallets)
CREATE TABLE wallets (
    id VARCHAR(36) PRIMARY KEY,
    instructor_id VARCHAR(36) UNIQUE NOT NULL,
    available_balance DECIMAL(12, 2) DEFAULT 0.00,
    frozen_balance DECIMAL(12, 2) DEFAULT 0.00,
    total_earned DECIMAL(12, 2) DEFAULT 0.00,
    total_withdrawn DECIMAL(12, 2) DEFAULT 0.00,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (instructor_id) REFERENCES users(id)
);

-- Bảng 17: Lịch sử giao dịch ví (wallet_transactions)
CREATE TABLE wallet_transactions (
    id VARCHAR(36) PRIMARY KEY,
    wallet_id VARCHAR(36) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    type VARCHAR(50) NOT NULL, -- REVENUE_INCOME, PAYOUT_LOCK, PAYOUT_COMPLETED, REFUND_DEDUCT
    reference_id VARCHAR(36),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (wallet_id) REFERENCES wallets(id)
);

-- Bảng 18: Yêu cầu rút tiền (payout_requests)
CREATE TABLE payout_requests (
    id VARCHAR(36) PRIMARY KEY,
    instructor_id VARCHAR(36) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, COMPLETED, REJECTED, CANCELLED
    bank_account_info TEXT NOT NULL,
    proof_image_url VARCHAR(500),
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_by VARCHAR(36),
    processed_at TIMESTAMP,
    reject_reason TEXT,
    FOREIGN KEY (instructor_id) REFERENCES users(id),
    FOREIGN KEY (processed_by) REFERENCES users(id)
);

-- Bảng 19: Yêu cầu hoàn tiền (refund_requests)
CREATE TABLE refund_requests (
    id VARCHAR(36) PRIMARY KEY,
    order_item_id VARCHAR(36) NOT NULL,
    student_id VARCHAR(36) NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED, CANCELLED
    progress_at_request DECIMAL(5, 2) DEFAULT 0.00,
    has_certificate BOOLEAN DEFAULT FALSE,
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    FOREIGN KEY (order_item_id) REFERENCES order_items(id),
    FOREIGN KEY (student_id) REFERENCES users(id)
);