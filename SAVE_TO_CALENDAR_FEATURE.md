# 🗓️ Tính Năng: Lưu Sự Kiện Vào Calendar

## 📋 Tổng Quan

Tính năng "Lưu Event" cho phép người dùng xuất các sự kiện kỷ niệm dưới dạng file `.ics` (iCalendar format) để lưu trực tiếp vào ứng dụng calendar của điện thoại hoặc máy tính.

## 🎯 Mục Đích

- **Lưu vĩnh viễn**: Người dùng có thể lưu sự kiện vào calendar riêng của họ
- **Sync đa thiết bị**: Sự kiện sẽ được đồng bộ hóa qua các thiết bị
- **Nhắc nhở**: Hỗ trợ nhắc nhở theo số ngày đã cài đặt
- **Lặp lại hàng năm**: Event sẽ tự động lặp lại hàng năm

## 🎨 Giao Diện

### Vị Trí Icon

Trên mỗi card sự kiện trong phần "Sắp Đến" và "Tất Cả Kỷ Niệm", có các nút hành động:

```
┌─────────────────────────────────────────┐
│  Card Sự Kiện Kỷ Niệm                  │
│  ┌───────────────────────────────────┐ │
│  │ [🔔] [⬇️] [✏️] [🗑️]            │ │
│  │ Bell Download Edit Delete          │ │
│  └───────────────────────────────────┘ │
│                                         │
│  Tiêu đề: Ngày hẹn hò đầu tiên         │
│  Ngày: 15 tháng 6 năm 2024             │
│  Sắp đến: 5 ngày nữa                   │
└─────────────────────────────────────────┘
```

### Các Nút Hành Động

| Icon | Tên | Màu | Chức Năng |
|------|-----|-----|----------|
| 🔔 | Notification | Pink | Bật/Tắt thông báo |
| ⬇️ | **Save to Calendar** | Green | **Lưu vào calendar** |
| ✏️ | Edit | Blue | Chỉnh sửa sự kiện |
| 🗑️ | Delete | Red | Xóa sự kiện |

## 🔧 Công Nghệ

### File Format: iCalendar (.ics)

Định dạng chuẩn để chia sẻ sự kiện giữa các ứng dụng calendar:

```ics
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Love Diary//Love Journey//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
DTSTART;VALUE=DATE:20240615
DTEND;VALUE=DATE:20240615
UID:anniversary-abc123-2024@lovediaryapp
DTSTAMP:20251130T120000Z
SUMMARY:Ngày hẹn hò đầu tiên
DESCRIPTION:Kỷ niệm quan trọng
RRULE:FREQ=YEARLY
ALARM:-PT7D
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR
```

### Hàm Chính

#### 1. `generateICS(anniversary)` 
Tạo nội dung file `.ics` từ thông tin sự kiện

```typescript
const generateICS = (anniversary: Anniversary): string => {
  // Chuyển đổi ngày thành định dạng YYYYMMDD
  const formattedDate = `${year}${month}${day}`;
  
  // Tạo unique identifier
  const uid = `anniversary-${anniversary.id}-${year}@lovediaryapp`;
  
  // Xây dựng file .ics
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Love Diary//Love Journey//EN',
    // ... các thông tin sự kiện
    'RRULE:FREQ=YEARLY',  // Lặp lại hàng năm
    'ALARM:-PT{days}D',   // Nhắc nhở trước N ngày
    'END:VCALENDAR'
  ].join('\r\n');
};
```

#### 2. `handleSaveToCalendar(anniversary)`
Xử lý download file và lưu vào calendar

```typescript
const handleSaveToCalendar = (anniversary: Anniversary) => {
  // 1. Tạo file .ics
  const icsContent = generateICS(anniversary);
  
  // 2. Chuyển đổi thành Blob
  const blob = new Blob([icsContent], { type: 'text/calendar' });
  
  // 3. Tạo link download
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  // 4. Đặt tên file
  const fileName = `${anniversary.title}_${anniversary.date}.ics`;
  
  // 5. Trigger download
  link.click();
};
```

## 📱 Cách Sử Dụng

### iOS (Apple Calendar)

1. Bấm nút ⬇️ trên card sự kiện
2. File `.ics` sẽ được download
3. Mở file trong ứng dụng Calendar
4. Bấm "Add to Calendar"
5. Chọn calendar để lưu
6. Sự kiện sẽ xuất hiện trong calendar của bạn

### Android (Google Calendar, Samsung Calendar, etc.)

1. Bấm nút ⬇️ trên card sự kiện
2. File `.ics` sẽ được download
3. Mở file bằng ứng dụng Calendar
4. Lưu sự kiện vào một trong các calendar của bạn
5. Sự kiện sẽ tự động đồng bộ hóa

### Windows/Mac (Outlook, Apple Calendar)

1. Bấm nút ⬇️ trên card sự kiện
2. File `.ics` sẽ được download
3. Mở file hai lần hoặc kéo thả vào ứng dụng Calendar
4. Sự kiện sẽ được thêm vào calendar của bạn

## 📊 Thông Tin Sự Kiện Được Xuất

```
Tiêu đề (SUMMARY)
├── Loại sự kiện (DESCRIPTION)
├── Ngày (DTSTART, DTEND)
├── Lặp lại (RRULE: FREQ=YEARLY)
├── Nhắc nhở (ALARM: -PT{days}D)
└── ID duy nhất (UID: anniversary-{id}-{year}@lovediaryapp)
```

## 🛠️ Lỗi & Xử Lý

### Khi Download Thất Bại

```typescript
try {
  // Tạo và download file
} catch (err) {
  alert('❌ Không thể tạo file calendar. Vui lòng thử lại.');
  console.error('Error creating ICS:', err);
}
```

### Thông Báo Thành Công

```
✅ Sự kiện "Ngày hẹn hò đầu tiên" đã sẵn sàng để lưu vào calendar!
```

## 🎨 CSS Styling

```css
.save-calendar-button {
  background: #d1fae5;      /* Xanh nhạt */
  color: #059669;           /* Xanh đậm */
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.save-calendar-button:hover {
  background: #a7f3d0;      /* Xanh hơn */
  transform: scale(1.1);    /* Phóng to */
}
```

## ✨ Tính Năng Phát Triển

- ✅ Export sự kiện dạng `.ics`
- ✅ Hỗ trợ lặp lại hàng năm
- ✅ Hỗ trợ nhắc nhở
- 🔄 Có thể thêm: Direct Google Calendar API integration
- 🔄 Có thể thêm: Shared calendar link
- 🔄 Có thể thêm: Email calendar invitation

## 🔗 Liên Kết Liên Quan

- **File chính**: `src/AnniversaryReminders.tsx`
- **CSS**: `src/styles/AnniversaryReminders.css`
- **iCalendar spec**: https://tools.ietf.org/html/rfc5545

## 📝 Lịch Sử Thay Đổi

### Version 1.0 (2025-11-30)
- ✅ Tính năng lưu sự kiện vào calendar
- ✅ Support định dạng iCalendar (.ics)
- ✅ Hỗ trợ recurring yearly events
- ✅ Hỗ trợ custom reminders

---

**Commit**: `e39a3b8`  
**Tính năng**: Lưu sự kiện kỷ niệm vào calendar  
**Trạng thái**: ✅ Đã triển khai production
