import { ArrowLeft, FileText, CheckCircle, XCircle, AlertTriangle, Scale, UserCheck, Languages } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

type Language = 'en' | 'vi';

export default function TermsOfService() {
  const navigate = useNavigate();
  const [language, setLanguage] = useState<Language>('en');

  const content = {
    en: {
      title: "Terms of Service",
      lastUpdated: "Last updated: January 1, 2025",
      back: "Back",
      acceptance: {
        title: "Acceptance of Terms",
        text: "By accessing and using Love Journal (\"Service\"), you accept and agree to be bound by the terms and conditions of this agreement. If you do not agree to these terms, please do not use our Service."
      },
      account: {
        title: "Account Registration",
        eligibility: "Eligibility",
        eligibilityItems: [
          "You must be at least 13 years old to use this Service",
          "You must provide accurate and complete information",
          "You are responsible for maintaining account security"
        ],
        security: "Account Security",
        securityItems: [
          "Keep your password confidential",
          "Notify us immediately of unauthorized access",
          "You are responsible for all activities under your account"
        ]
      },
      userContent: {
        title: "Your Content",
        ownership: "Ownership",
        ownershipText: "You retain all rights to the content you create and upload to Love Journal. We do not claim ownership of your memories, photos, or personal information.",
        license: "License to Us",
        licenseText: "By uploading content, you grant us a limited license to:",
        licenseItems: [
          "Store and display your content within the Service",
          "Process images for optimization and storage",
          "Enable sharing features with your partner (if you choose)"
        ]
      },
      prohibited: {
        title: "Prohibited Activities",
        text: "You agree NOT to:",
        items: [
          "Upload illegal, harmful, or offensive content",
          "Violate any laws or regulations",
          "Impersonate others or create fake accounts",
          "Attempt to hack or compromise the Service",
          "Use the Service for commercial purposes without permission",
          "Spam or abuse other users"
        ]
      },
      availability: {
        title: "Service Availability",
        intro: "We strive to provide reliable service, but we do not guarantee:",
        items: [
          "100% uptime or uninterrupted access",
          "Error-free operation",
          "That the Service will meet all your requirements"
        ],
        disclaimer: "We reserve the right to modify, suspend, or discontinue the Service at any time with or without notice."
      },
      termination: {
        title: "Account Termination",
        byYou: "By You",
        byYouText: "You may delete your account at any time through the Settings page. Your data will be permanently deleted after a 7-day grace period.",
        byUs: "By Us",
        byUsText: "We reserve the right to suspend or terminate your account if you:",
        byUsItems: [
          "Violate these Terms of Service",
          "Engage in prohibited activities",
          "Provide false information"
        ]
      },
      liability: {
        title: "Limitation of Liability",
        text: "Love Journal and its operators shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the Service. We are not responsible for data loss, though we implement backup measures."
      },
      changes: {
        title: "Changes to Terms",
        text: "We may update these Terms from time to time. We will notify you of significant changes via email or in-app notification. Continued use of the Service after changes constitutes acceptance of the new Terms."
      },
      contact: {
        title: "Questions?",
        text: "If you have questions about these Terms of Service, please contact us at:"
      }
    },
    vi: {
      title: "Điều Khoản Dịch Vụ",
      lastUpdated: "Cập nhật lần cuối: 1 Tháng 1, 2025",
      back: "Quay lại",
      acceptance: {
        title: "Chấp Nhận Điều Khoản",
        text: "Bằng cách truy cập và sử dụng Love Journal (\"Dịch vụ\"), bạn chấp nhận và đồng ý bị ràng buộc bởi các điều khoản và điều kiện của thỏa thuận này. Nếu bạn không đồng ý với các điều khoản này, vui lòng không sử dụng Dịch vụ của chúng tôi."
      },
      account: {
        title: "Đăng Ký Tài Khoản",
        eligibility: "Điều Kiện",
        eligibilityItems: [
          "Bạn phải ít nhất 13 tuổi để sử dụng Dịch vụ này",
          "Bạn phải cung cấp thông tin chính xác và đầy đủ",
          "Bạn chịu trách nhiệm duy trì bảo mật tài khoản"
        ],
        security: "Bảo Mật Tài Khoản",
        securityItems: [
          "Giữ mật khẩu của bạn bí mật",
          "Thông báo cho chúng tôi ngay lập tức nếu có truy cập trái phép",
          "Bạn chịu trách nhiệm cho tất cả hoạt động dưới tài khoản của bạn"
        ]
      },
      userContent: {
        title: "Nội Dung Của Bạn",
        ownership: "Quyền Sở Hữu",
        ownershipText: "Bạn giữ tất cả quyền đối với nội dung bạn tạo và tải lên Love Journal. Chúng tôi không tuyên bố quyền sở hữu đối với kỷ niệm, ảnh hoặc thông tin cá nhân của bạn.",
        license: "Giấy Phép Cho Chúng Tôi",
        licenseText: "Bằng việc tải lên nội dung, bạn cấp cho chúng tôi giấy phép giới hạn để:",
        licenseItems: [
          "Lưu trữ và hiển thị nội dung của bạn trong Dịch vụ",
          "Xử lý hình ảnh để tối ưu hóa và lưu trữ",
          "Kích hoạt tính năng chia sẻ với đối tác của bạn (nếu bạn chọn)"
        ]
      },
      prohibited: {
        title: "Hoạt Động Bị Cấm",
        text: "Bạn đồng ý KHÔNG:",
        items: [
          "Tải lên nội dung bất hợp pháp, có hại hoặc xúc phạm",
          "Vi phạm bất kỳ luật lệ hoặc quy định nào",
          "Mạo danh người khác hoặc tạo tài khoản giả",
          "Cố gắng hack hoặc xâm phạm Dịch vụ",
          "Sử dụng Dịch vụ cho mục đích thương mại mà không được phép",
          "Spam hoặc lạm dụng người dùng khác"
        ]
      },
      availability: {
        title: "Tính Sẵn Sàng Của Dịch Vụ",
        intro: "Chúng tôi cố gắng cung cấp dịch vụ đáng tin cậy, nhưng không đảm bảo:",
        items: [
          "100% thời gian hoạt động hoặc truy cập không bị gián đoạn",
          "Hoạt động không có lỗi",
          "Dịch vụ sẽ đáp ứng tất cả yêu cầu của bạn"
        ],
        disclaimer: "Chúng tôi có quyền sửa đổi, tạm ngưng hoặc ngừng Dịch vụ bất kỳ lúc nào có hoặc không có thông báo."
      },
      termination: {
        title: "Chấm Dứt Tài Khoản",
        byYou: "Do Bạn",
        byYouText: "Bạn có thể xóa tài khoản của mình bất kỳ lúc nào thông qua trang Cài đặt. Dữ liệu của bạn sẽ bị xóa vĩnh viễn sau thời gian gia hạn 7 ngày.",
        byUs: "Do Chúng Tôi",
        byUsText: "Chúng tôi có quyền tạm ngưng hoặc chấm dứt tài khoản của bạn nếu bạn:",
        byUsItems: [
          "Vi phạm các Điều khoản Dịch vụ này",
          "Tham gia vào các hoạt động bị cấm",
          "Cung cấp thông tin sai lệch"
        ]
      },
      liability: {
        title: "Giới Hạn Trách Nhiệm",
        text: "Love Journal và các nhà điều hành của nó sẽ không chịu trách nhiệm về bất kỳ thiệt hại gián tiếp, ngẫu nhiên, đặc biệt, hậu quả hoặc trừng phạt nào phát sinh từ việc sử dụng hoặc không thể sử dụng Dịch vụ. Chúng tôi không chịu trách nhiệm về mất dữ liệu, mặc dù chúng tôi thực hiện các biện pháp sao lưu."
      },
      changes: {
        title: "Thay Đổi Điều Khoản",
        text: "Chúng tôi có thể cập nhật các Điều khoản này theo thời gian. Chúng tôi sẽ thông báo cho bạn về những thay đổi quan trọng qua email hoặc thông báo trong ứng dụng. Việc tiếp tục sử dụng Dịch vụ sau khi có thay đổi đồng nghĩa với việc chấp nhận các Điều khoản mới."
      },
      contact: {
        title: "Có Câu Hỏi?",
        text: "Nếu bạn có câu hỏi về Điều khoản Dịch vụ này, vui lòng liên hệ với chúng tôi tại:"
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
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
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-md'
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
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-md'
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
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-cyan-600 shadow-2xl shadow-blue-500/30 mb-6">
            <FileText className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 bg-clip-text text-transparent mb-4">
            {content[language].title}
          </h1>
          <p className="text-gray-600 text-lg">{content[language].lastUpdated}</p>
        </div>

        {/* Content */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-200 p-8 sm:p-12 space-y-10">
          
          {/* Acceptance */}
          <section>
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">{content[language].acceptance.title}</h2>
                <p className="text-gray-600 leading-relaxed">{content[language].acceptance.text}</p>
              </div>
            </div>
          </section>

          {/* Account Registration */}
          <section>
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
                <UserCheck className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{content[language].account.title}</h2>
                
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{content[language].account.eligibility}</h3>
                <ul className="space-y-2 mb-4 text-gray-600">
                  {content[language].account.eligibilityItems.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="text-blue-500">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <h3 className="text-lg font-semibold text-gray-800 mb-2">{content[language].account.security}</h3>
                <ul className="space-y-2 text-gray-600">
                  {content[language].account.securityItems.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="text-blue-500">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* User Content */}
          <section>
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{content[language].userContent.title}</h2>
                
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{content[language].userContent.ownership}</h3>
                <p className="text-gray-600 leading-relaxed mb-4">{content[language].userContent.ownershipText}</p>

                <h3 className="text-lg font-semibold text-gray-800 mb-2">{content[language].userContent.license}</h3>
                <p className="text-gray-600 leading-relaxed mb-4">{content[language].userContent.licenseText}</p>
                <ul className="space-y-2 text-gray-600">
                  {content[language].userContent.licenseItems.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="text-purple-500">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* Prohibited Activities */}
          <section>
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center flex-shrink-0">
                <XCircle className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{content[language].prohibited.title}</h2>
                <p className="text-gray-600 leading-relaxed mb-4">{content[language].prohibited.text}</p>
                <ul className="space-y-2 text-gray-600">
                  {content[language].prohibited.items.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="text-red-500">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* Service Availability */}
          <section>
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{content[language].availability.title}</h2>
                <p className="text-gray-600 leading-relaxed mb-4">{content[language].availability.intro}</p>
                <ul className="space-y-2 text-gray-600 mb-4">
                  {content[language].availability.items.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="text-amber-500">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-gray-600 leading-relaxed">{content[language].availability.disclaimer}</p>
              </div>
            </div>
          </section>

          {/* Account Termination */}
          <section>
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-500 to-slate-600 flex items-center justify-center flex-shrink-0">
                <XCircle className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{content[language].termination.title}</h2>
                
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{content[language].termination.byYou}</h3>
                <p className="text-gray-600 leading-relaxed mb-4">{content[language].termination.byYouText}</p>

                <h3 className="text-lg font-semibold text-gray-800 mb-2">{content[language].termination.byUs}</h3>
                <p className="text-gray-600 leading-relaxed mb-4">{content[language].termination.byUsText}</p>
                <ul className="space-y-2 text-gray-600">
                  {content[language].termination.byUsItems.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="text-gray-500">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* Limitation of Liability */}
          <section>
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                <Scale className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{content[language].liability.title}</h2>
                <p className="text-gray-600 leading-relaxed">{content[language].liability.text}</p>
              </div>
            </div>
          </section>

          {/* Changes to Terms */}
          <section>
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{content[language].changes.title}</h2>
                <p className="text-gray-600 leading-relaxed">{content[language].changes.text}</p>
              </div>
            </div>
          </section>

          {/* Contact */}
          <section className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-200">
            <h2 className="text-xl font-bold text-gray-900 mb-3">{content[language].contact.title}</h2>
            <p className="text-gray-600 leading-relaxed">
              {content[language].contact.text}{' '}
              <a href="mailto:lovememory@gmail.com" className="text-blue-600 hover:text-blue-700 font-semibold">
                lovememory@gmail.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
