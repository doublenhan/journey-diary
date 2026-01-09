import { ArrowLeft, Shield, Lock, Eye, Database, UserX, Bell, Cookie, Languages } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

type Language = 'en' | 'vi';

export default function PrivacyPolicy() {
  const navigate = useNavigate();
  const [language, setLanguage] = useState<Language>('en');

  const content = {
    en: {
      title: "Privacy Policy",
      lastUpdated: "Last updated: January 1, 2025",
      back: "Back",
      introduction: {
        title: "Introduction",
        text: "At Love Journal, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service. By using Love Journal, you agree to the collection and use of information in accordance with this policy."
      },
      infoCollect: {
        title: "Information We Collect",
        personal: "Personal Information",
        personalItems: [
          "Email address and phone number for account creation",
          "Profile information (name, birthdate)",
          "Partner connection data for couple features"
        ],
        memory: "Memory Content",
        memoryItems: [
          "Photos and images you upload",
          "Text content, titles, and descriptions",
          "Location data (if you choose to add it)",
          "Tags and categories"
        ],
        usage: "Usage Data",
        usageItems: [
          "Device information and browser type",
          "IP address and general location",
          "Usage patterns and feature interactions"
        ]
      },
      howWeUse: {
        title: "How We Use Your Information",
        items: [
          "To provide and maintain our service",
          "To enable couple features and memory sharing",
          "To send anniversary reminders and notifications",
          "To improve our service and user experience",
          "To provide customer support",
          "To detect and prevent fraud or abuse"
        ]
      },
      security: {
        title: "Data Security",
        intro: "We implement industry-standard security measures to protect your data:",
        items: [
          "End-to-end encryption for sensitive data",
          "Secure Firebase authentication and storage",
          "Regular security audits and updates",
          "Access controls and authentication"
        ]
      },
      rights: {
        title: "Your Rights",
        intro: "You have the right to:",
        items: [
          "Access your personal data",
          "Correct inaccurate data",
          "Delete your account and data (with 7-day grace period)",
          "Export your data",
          "Opt-out of notifications"
        ]
      },
      thirdParty: {
        title: "Third-Party Services",
        intro: "We use the following third-party services:",
        items: [
          { name: "Firebase:", desc: "Authentication, database, and storage" },
          { name: "Cloudinary:", desc: "Image optimization and hosting" },
          { name: "Vercel:", desc: "Hosting and deployment" }
        ]
      },
      cookies: {
        title: "Cookies",
        text: "We use cookies and similar technologies to enhance your experience. See our",
        link: "Cookies Policy",
        text2: "for more details."
      },
      contact: {
        title: "Contact Us",
        text: "If you have questions about this Privacy Policy, please contact us at:"
      }
    },
    vi: {
      title: "Chính Sách Bảo Mật",
      lastUpdated: "Cập nhật lần cuối: 1 Tháng 1, 2025",
      back: "Quay lại",
      introduction: {
        title: "Giới thiệu",
        text: "Tại Love Journal, chúng tôi coi trọng quyền riêng tư của bạn. Chính sách bảo mật này giải thích cách chúng tôi thu thập, sử dụng, tiết lộ và bảo vệ thông tin của bạn khi sử dụng dịch vụ. Bằng việc sử dụng Love Journal, bạn đồng ý với việc thu thập và sử dụng thông tin theo chính sách này."
      },
      infoCollect: {
        title: "Thông Tin Chúng Tôi Thu Thập",
        personal: "Thông Tin Cá Nhân",
        personalItems: [
          "Địa chỉ email và số điện thoại để tạo tài khoản",
          "Thông tin hồ sơ (tên, ngày sinh)",
          "Dữ liệu kết nối đối tác cho tính năng couple"
        ],
        memory: "Nội Dung Kỷ Niệm",
        memoryItems: [
          "Ảnh và hình ảnh bạn tải lên",
          "Nội dung văn bản, tiêu đề và mô tả",
          "Dữ liệu vị trí (nếu bạn chọn thêm)",
          "Tags và danh mục"
        ],
        usage: "Dữ Liệu Sử Dụng",
        usageItems: [
          "Thông tin thiết bị và loại trình duyệt",
          "Địa chỉ IP và vị trí chung",
          "Mẫu sử dụng và tương tác tính năng"
        ]
      },
      howWeUse: {
        title: "Cách Chúng Tôi Sử Dụng Thông Tin",
        items: [
          "Để cung cấp và duy trì dịch vụ",
          "Để kích hoạt tính năng couple và chia sẻ kỷ niệm",
          "Để gửi nhắc nhở kỷ niệm và thông báo",
          "Để cải thiện dịch vụ và trải nghiệm người dùng",
          "Để cung cấp hỗ trợ khách hàng",
          "Để phát hiện và ngăn chặn gian lận hoặc lạm dụng"
        ]
      },
      security: {
        title: "Bảo Mật Dữ Liệu",
        intro: "Chúng tôi triển khai các biện pháp bảo mật tiêu chuẩn ngành để bảo vệ dữ liệu của bạn:",
        items: [
          "Mã hóa đầu cuối cho dữ liệu nhạy cảm",
          "Xác thực và lưu trữ Firebase an toàn",
          "Kiểm tra và cập nhật bảo mật thường xuyên",
          "Kiểm soát truy cập và xác thực"
        ]
      },
      rights: {
        title: "Quyền Của Bạn",
        intro: "Bạn có quyền:",
        items: [
          "Truy cập dữ liệu cá nhân của bạn",
          "Sửa dữ liệu không chính xác",
          "Xóa tài khoản và dữ liệu (với thời gian gia hạn 7 ngày)",
          "Xuất dữ liệu của bạn",
          "Từ chối nhận thông báo"
        ]
      },
      thirdParty: {
        title: "Dịch Vụ Bên Thứ Ba",
        intro: "Chúng tôi sử dụng các dịch vụ bên thứ ba sau:",
        items: [
          { name: "Firebase:", desc: "Xác thực, cơ sở dữ liệu và lưu trữ" },
          { name: "Cloudinary:", desc: "Tối ưu hóa và lưu trữ hình ảnh" },
          { name: "Vercel:", desc: "Hosting và triển khai" }
        ]
      },
      cookies: {
        title: "Cookies",
        text: "Chúng tôi sử dụng cookies và các công nghệ tương tự để nâng cao trải nghiệm của bạn. Xem",
        link: "Chính Sách Cookies",
        text2: "để biết thêm chi tiết."
      },
      contact: {
        title: "Liên Hệ Chúng Tôi",
        text: "Nếu bạn có câu hỏi về Chính sách bảo mật này, vui lòng liên hệ với chúng tôi tại:"
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-pink-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="group flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 rounded-xl transition-all duration-200 shadow-sm border border-gray-200"
            >
              <ArrowLeft className="w-4 h-4 text-gray-600 group-hover:-translate-x-1 transition-transform" />
              <span className="text-gray-700 font-semibold text-sm">{content[language].back}</span>
            </button>
            
            {/* Language Toggle */}
            <div className="flex items-center gap-2 bg-white rounded-xl p-1 shadow-sm border border-gray-200">
              <button
                onClick={() => setLanguage('en')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  language === 'en'
                    ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Languages className="w-3.5 h-3.5" />
                EN
              </button>
              <button
                onClick={() => setLanguage('vi')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  language === 'vi'
                    ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Languages className="w-3.5 h-3.5" />
                VN
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-2xl shadow-violet-500/30 mb-6">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            {content[language].title}
          </h1>
          <p className="text-gray-600 text-lg">{content[language].lastUpdated}</p>
        </div>

        {/* Content */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-200 p-8 sm:p-12 space-y-10">
          
          {/* Introduction */}
          <section>
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                <Eye className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">{content[language].introduction.title}</h2>
                <p className="text-gray-600 leading-relaxed">
                  {content[language].introduction.text}
                </p>
              </div>
            </div>
          </section>

          {/* Information We Collect */}
          <section>
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center flex-shrink-0">
                <Database className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{content[language].infoCollect.title}</h2>
                
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{content[language].infoCollect.personal}</h3>
                <ul className="space-y-2 mb-4 text-gray-600">
                  {content[language].infoCollect.personalItems.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="text-violet-500">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <h3 className="text-lg font-semibold text-gray-800 mb-2">{content[language].infoCollect.memory}</h3>
                <ul className="space-y-2 mb-4 text-gray-600">
                  {content[language].infoCollect.memoryItems.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="text-violet-500">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <h3 className="text-lg font-semibold text-gray-800 mb-2">{content[language].infoCollect.usage}</h3>
                <ul className="space-y-2 text-gray-600">
                  {content[language].infoCollect.usageItems.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="text-violet-500">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* How We Use Information */}
          <section>
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center flex-shrink-0">
                <Lock className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{content[language].howWeUse.title}</h2>
                <ul className="space-y-2 text-gray-600">
                  {content[language].howWeUse.items.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="text-pink-500">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* Data Security */}
          <section>
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{content[language].security.title}</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  {content[language].security.intro}
                </p>
                <ul className="space-y-2 text-gray-600">
                  {content[language].security.items.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="text-green-500">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* Your Rights */}
          <section>
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center flex-shrink-0">
                <UserX className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{content[language].rights.title}</h2>
                <p className="text-gray-600 leading-relaxed mb-4">{content[language].rights.intro}</p>
                <ul className="space-y-2 text-gray-600">
                  {content[language].rights.items.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="text-orange-500">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* Third-Party Services */}
          <section>
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                <Bell className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{content[language].thirdParty.title}</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  {content[language].thirdParty.intro}
                </p>
                <ul className="space-y-2 text-gray-600">
                  {content[language].thirdParty.items.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="text-indigo-500">•</span>
                      <span><strong>{item.name}</strong> {item.desc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* Cookies */}
          <section>
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center flex-shrink-0">
                <Cookie className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{content[language].cookies.title}</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  {content[language].cookies.text}{' '}
                  <a href="/cookies-policy" className="text-violet-600 hover:text-violet-700 font-semibold underline">
                    {content[language].cookies.link}
                  </a>{' '}
                  {content[language].cookies.text2}
                </p>
              </div>
            </div>
          </section>

          {/* Contact */}
          <section className="bg-gradient-to-br from-violet-50 to-pink-50 rounded-2xl p-6 border border-violet-200">
            <h2 className="text-xl font-bold text-gray-900 mb-3">{content[language].contact.title}</h2>
            <p className="text-gray-600 leading-relaxed">
              {content[language].contact.text}{' '}
              <a href="mailto:lovememory@gmail.com" className="text-violet-600 hover:text-violet-700 font-semibold">
                lovememory@gmail.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
