// Điền 2 giá trị của dự án Supabase (Project Settings → API Keys):
//   url     = Project URL, dạng https://xxxx.supabase.co
//   anonKey = khoá "publishable" (sb_publishable_...) hoặc "anon public" (eyJ...)
// Hai giá trị này được phép để công khai; dữ liệu vẫn được bảo vệ bằng đăng nhập.
//
// ai: "claude" = đọc ảnh bằng app Claude anh đang đăng ký (miễn phí theo gói, thao tác chép–dán)
//     "api"    = đọc tự động qua Claude API (cần làm thêm bước 5 trong HUONG-DAN.md, tính tiền theo lượt)
window.NS_CONFIG = {
  url: "https://rpcnqzkvdlwaqxmbzkhe.supabase.co",
  anonKey: "sb_publishable_8IOpFwHjyQkmwuJZLuEOHQ_o2KTGTde",
  driveAccount: "internal.10e@gmail.com",
  googleClientId: "1079824988459-99p2hhso32aebvg7pmc242kstmqkumtq.apps.googleusercontent.com",
  ai: "claude"
};
