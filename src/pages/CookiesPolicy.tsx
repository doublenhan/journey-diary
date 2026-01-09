import { ArrowLeft, Cookie, Settings, Eye, Target, BarChart, Shield, Languages } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

type Language = 'en' | 'vi';

export default function CookiesPolicy() {
  const navigate = useNavigate();
  const [language, setLanguage] = useState<Language>('en');

  const content = {
    en: {
      title: "Cookies Policy",
      lastUpdated: "Last updated: January 1, 2025",
      back: "Back",
      whatAre: {
        title: "What Are Cookies?",
        text: "Cookies are small text files that are placed on your device when you visit our website. They help us provide you with a better experience by remembering your preferences and understanding how you use our Service."
      },
      types: {
        title: "Types of Cookies We Use",
        essential: {
          title: "Essential Cookies",
          desc: "Required for the website to function properly. These cannot be disabled.",
          items: [
            { name: "Authentication:", desc: "Keep you logged in" },
            { name: "Security:", desc: "Protect against fraud and abuse" },
            { name: "Session:", desc: "Remember your session state" }
          ]
        },
        functional: {
          title: "Functional Cookies",
          desc: "Remember your preferences and choices.",
          items: [
            { name: "Theme:", desc: "Remember your mood theme preference" },
            { name: "Language:", desc: "Remember your language choice" },
            { name: "Settings:", desc: "Store your visual effects preferences" }
          ]
        },
        analytics: {
          title: "Analytics Cookies",
          desc: "Help us understand how you use our Service.",
          items: [
            { name: "Usage:", desc: "Track which features you use most" },
            { name: "Performance:", desc: "Monitor loading times and errors" },
            { name: "Firebase Analytics:", desc: "Anonymous usage statistics" }
          ]
        },
        performance: {
          title: "Performance Cookies",
          desc: "Optimize website performance and user experience.",
          items: [
            { name: "Caching:", desc: "Store frequently accessed data" },
            { name: "CDN:", desc: "Optimize content delivery" }
          ]
        }
      },
      thirdParty: {
        title: "Third-Party Cookies",
        intro: "We use services from trusted third parties that may set cookies:",
        items: [
          { name: "Firebase (Google):", desc: "Authentication, analytics, and performance monitoring" },
          { name: "Cloudinary:", desc: "Image optimization and delivery" },
          { name: "Vercel:", desc: "Hosting and performance optimization" }
        ]
      },
      managing: {
        title: "Managing Your Cookies",
        browser: "Browser Settings",
        browserText: "Most browsers allow you to control cookies through their settings. You can:",
        browserItems: [
          "Block all cookies",
          "Allow only first-party cookies",
          "Delete cookies when you close your browser",
          "Delete existing cookies"
        ],
        warning: "⚠️ Note:",
        warningText: "Blocking or deleting cookies may affect your ability to use certain features of Love Journal, such as staying logged in or saving your preferences."
      },
      storage: {
        title: "Local Storage",
        intro: "In addition to cookies, we use browser local storage to:",
        items: [
          "Cache memories for offline viewing",
          "Store your theme and settings preferences",
          "Improve app performance"
        ]
      },
      updates: {
        title: "Updates to This Policy",
        text: "We may update this Cookies Policy from time to time to reflect changes in technology or regulations. We will notify you of any significant changes."
      },
      contact: {
        title: "Questions About Cookies?",
        text: "If you have questions about how we use cookies, please contact us at:"
      }
    },
    vi: {
      title: "Chính Sách Cookies",
      lastUpdated: "Cập nhật lần cuối: 1 Tháng 1, 2025",
      back: "Quay lại",
      whatAre: {
        title: "Cookies Là Gì?",
        text: "Cookies là các tệp văn bản nhỏ được đặt trên thiết bị của bạn khi bạn truy cập trang web của chúng tôi. Chúng giúp chúng tôi cung cấp cho bạn trải nghiệm tốt hơn bằng cách ghi nhớ sở thích của bạn và hiểu cách bạn sử dụng Dịch vụ của chúng tôi."
      },
      types: {
        title: "Các Loại Cookies Chúng Tôi Sử Dụng",
        essential: {
          title: "Cookies Thiết Yếu",
          desc: "Cần thiết để trang web hoạt động bình thường. Không thể vô hiệu hóa.",
          items: [
            { name: "Xác thực:", desc: "Giữ bạn đăng nhập" },
            { name: "Bảo mật:", desc: "Bảo vệ chống gian lận và lạm dụng" },
            { name: "Phiên:", desc: "Ghi nhớ trạng thái phiên của bạn" }
          ]
        },
        functional: {
          title: "Cookies Chức Năng",
          desc: "Ghi nhớ sở thích và lựa chọn của bạn.",
          items: [
            { name: "Giao diện:", desc: "Ghi nhớ cài đặt giao diện tâm trạng của bạn" },
            { name: "Ngôn ngữ:", desc: "Ghi nhớ lựa chọn ngôn ngữ của bạn" },
            { name: "Cài đặt:", desc: "Lưu trữ các tùy chọn hiệu ứng hình ảnh" }
          ]
        },
        analytics: {
          title: "Cookies Phân Tích",
          desc: "Giúp chúng tôi hiểu cách bạn sử dụng Dịch vụ.",
          items: [
            { name: "Sử dụng:", desc: "Theo dõi các tính năng bạn sử dụng nhiều nhất" },
            { name: "Hiệu suất:", desc: "Giám sát thời gian tải và lỗi" },
            { name: "Firebase Analytics:", desc: "Thống kê sử dụng ẩn danh" }
          ]
        },
        performance: {
          title: "Cookies Hiệu Suất",
          desc: "Tối ưu hóa hiệu suất trang web và trải nghiệm người dùng.",
          items: [
            { name: "Bộ nhớ đệm:", desc: "Lưu trữ dữ liệu được truy cập thường xuyên" },
            { name: "CDN:", desc: "Tối ưu hóa phân phối nội dung" }
          ]
        }
      },
      thirdParty: {
        title: "Cookies Bên Thứ Ba",
        intro: "Chúng tôi sử dụng dịch vụ từ các bên thứ ba đáng tin cậy có thể đặt cookies:",
        items: [
          { name: "Firebase (Google):", desc: "Xác thực, phân tích và giám sát hiệu suất" },
          { name: "Cloudinary:", desc: "Tối ưu hóa và phân phối hình ảnh" },
          { name: "Vercel:", desc: "Hosting và tối ưu hóa hiệu suất" }
        ]
      },
      managing: {
        title: "Quản Lý Cookies Của Bạn",
        browser: "Cài Đặt Trình Duyệt",
        browserText: "Hầu hết các trình duyệt cho phép bạn kiểm soát cookies thông qua cài đặt của chúng. Bạn có thể:",
        browserItems: [
          "Chặn tất cả cookies",
          "Chỉ cho phép cookies bên thứ nhất",
          "Xóa cookies khi đóng trình duyệt",
          "Xóa cookies hiện có"
        ],
        warning: "⚠️ Lưu ý:",
        warningText: "Chặn hoặc xóa cookies có thể ảnh hưởng đến khả năng sử dụng một số tính năng của Love Journal, chẳng hạn như duy trì đăng nhập hoặc lưu sở thích của bạn."
      },
      storage: {
        title: "Bộ Nhớ Cục Bộ",
        intro: "Ngoài cookies, chúng tôi sử dụng bộ nhớ cục bộ của trình duyệt để:",
        items: [
          "Lưu cache kỷ niệm để xem ngoại tuyến",
          "Lưu trữ giao diện và cài đặt sở thích của bạn",
          "Cải thiện hiệu suất ứng dụng"
        ]
      },
      updates: {
        title: "Cập Nhật Chính Sách Này",
        text: "Chúng tôi có thể cập nhật Chính sách Cookies này theo thời gian để phản ánh các thay đổi về công nghệ hoặc quy định. Chúng tôi sẽ thông báo cho bạn về bất kỳ thay đổi quan trọng nào."
      },
      contact: {
        title: "Có Câu Hỏi Về Cookies?",
        text: "Nếu bạn có câu hỏi về cách chúng tôi sử dụng cookies, vui lòng liên hệ với chúng tôi tại:"
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
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
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md'
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
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md'
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
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-2xl shadow-amber-500/30 mb-6">
            <Cookie className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 bg-clip-text text-transparent mb-4">
            {content[language].title}
          </h1>
          <p className="text-gray-600 text-lg">{content[language].lastUpdated}</p>
        </div>

        {/* Content */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-200 p-8 sm:p-12 space-y-10">
          
          {/* What Are Cookies */}
          <section>
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center flex-shrink-0">
                <Cookie className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">{content[language].whatAre.title}</h2>
                <p className="text-gray-600 leading-relaxed">{content[language].whatAre.text}</p>
              </div>
            </div>
          </section>

          {/* Types of Cookies */}
          <section>
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center flex-shrink-0">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{content[language].types.title}</h2>
                
                {/* Essential Cookies */}
                <div className="mb-6 p-4 bg-green-50 rounded-xl border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-5 h-5 text-green-600" />
                    <h3 className="text-lg font-semibold text-gray-800">{content[language].types.essential.title}</h3>
                  </div>
                  <p className="text-gray-600 text-sm mb-2">{content[language].types.essential.desc}</p>
                  <ul className="space-y-1 text-sm text-gray-600">
                    {content[language].types.essential.items.map((item, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <span className="text-green-500">•</span>
                        <span><strong>{item.name}</strong> {item.desc}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Functional Cookies */}
                <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Eye className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-800">{content[language].types.functional.title}</h3>
                  </div>
                  <p className="text-gray-600 text-sm mb-2">{content[language].types.functional.desc}</p>
                  <ul className="space-y-1 text-sm text-gray-600">
                    {content[language].types.functional.items.map((item, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <span className="text-blue-500">•</span>
                        <span><strong>{item.name}</strong> {item.desc}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Analytics Cookies */}
                <div className="mb-6 p-4 bg-purple-50 rounded-xl border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart className="w-5 h-5 text-purple-600" />
                    <h3 className="text-lg font-semibold text-gray-800">{content[language].types.analytics.title}</h3>
                  </div>
                  <p className="text-gray-600 text-sm mb-2">{content[language].types.analytics.desc}</p>
                  <ul className="space-y-1 text-sm text-gray-600">
                    {content[language].types.analytics.items.map((item, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <span className="text-purple-500">•</span>
                        <span><strong>{item.name}</strong> {item.desc}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Performance Cookies */}
                <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-5 h-5 text-orange-600" />
                    <h3 className="text-lg font-semibold text-gray-800">{content[language].types.performance.title}</h3>
                  </div>
                  <p className="text-gray-600 text-sm mb-2">{content[language].types.performance.desc}</p>
                  <ul className="space-y-1 text-sm text-gray-600">
                    {content[language].types.performance.items.map((item, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <span className="text-orange-500">•</span>
                        <span><strong>{item.name}</strong> {item.desc}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Third-Party Cookies */}
          <section>
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center flex-shrink-0">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{content[language].thirdParty.title}</h2>
                <p className="text-gray-600 leading-relaxed mb-4">{content[language].thirdParty.intro}</p>
                <ul className="space-y-3 text-gray-600">
                  {content[language].thirdParty.items.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="text-pink-500">•</span>
                      <div>
                        <strong className="text-gray-800">{item.name}</strong>
                        <span className="block text-sm mt-1">{item.desc}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* Managing Cookies */}
          <section>
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{content[language].managing.title}</h2>
                
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{content[language].managing.browser}</h3>
                <p className="text-gray-600 leading-relaxed mb-4">{content[language].managing.browserText}</p>
                <ul className="space-y-2 mb-4 text-gray-600">
                  {content[language].managing.browserItems.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="text-indigo-500">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="text-sm text-gray-700">
                    <strong className="text-amber-800">{content[language].managing.warning}</strong> {content[language].managing.warningText}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Data Storage */}
          <section>
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{content[language].storage.title}</h2>
                <p className="text-gray-600 leading-relaxed mb-4">{content[language].storage.intro}</p>
                <ul className="space-y-2 text-gray-600">
                  {content[language].storage.items.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="text-teal-500">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* Updates */}
          <section>
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-500 to-slate-600 flex items-center justify-center flex-shrink-0">
                <Cookie className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{content[language].updates.title}</h2>
                <p className="text-gray-600 leading-relaxed">{content[language].updates.text}</p>
              </div>
            </div>
          </section>

          {/* Contact */}
          <section className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200">
            <h2 className="text-xl font-bold text-gray-900 mb-3">{content[language].contact.title}</h2>
            <p className="text-gray-600 leading-relaxed">
              {content[language].contact.text}{' '}
              <a href="mailto:lovememory@gmail.com" className="text-amber-600 hover:text-amber-700 font-semibold">
                lovememory@gmail.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
