/**
 * Tiện ích phân tích và chuẩn hóa tệp phụ đề (.srt, .vtt, .txt)
 * Chuyển đổi thành định dạng transcript phục vụ AI RAG: [mm:ss] Nội dung lời nói
 */

/**
 * Chuyển chuỗi thời gian HH:MM:SS,mmm hoặc MM:SS.mmm thành định dạng [mm:ss]
 */
function formatTimestampToMinutesSeconds(
  hoursStr: string | undefined,
  minutesStr: string,
  secondsStr: string,
): string {
  const hours = hoursStr ? parseInt(hoursStr, 10) : 0;
  const minutes = parseInt(minutesStr, 10) + hours * 60;
  const seconds = parseInt(secondsStr, 10);
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  return `[${mm}:${ss}]`;
}

/**
 * Phân tích tệp phụ đề .srt, .vtt hoặc .txt thành chuỗi transcript chuẩn
 */
export function parseSubtitleToTranscript(rawContent: string): string {
  if (!rawContent || !rawContent.trim()) {
    return '';
  }

  // Chuẩn hóa xuống dòng Unix \n
  const clean = rawContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = clean.split('\n');
  const entries: Array<{ timeTag: string; text: string }> = [];

  // Regex nhận diện mốc thời gian:
  // SRT: 00:01:20,000 --> 00:01:25,000
  // VTT: 00:01:20.000 --> 00:01:25.000 hoặc 01:20.000 --> 01:25.000
  const timeRegex =
    /(?:(\d{1,2}):)?(\d{2}):(\d{2})[,.]\d{3}\s*-->\s*(?:(\d{1,2}):)?(\d{2}):(\d{2})[,.]\d{3}/;

  let activeTimeTag = '';
  let activeTextSegments: string[] = [];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i].trim();

    if (!line) {
      if (activeTimeTag && activeTextSegments.length > 0) {
        entries.push({
          timeTag: activeTimeTag,
          text: activeTextSegments.join(' '),
        });
        activeTimeTag = '';
        activeTextSegments = [];
      }
      continue;
    }

    // Bỏ qua tiêu đề WEBVTT, STYLE hoặc NOTE của file .vtt
    if (
      line.startsWith('WEBVTT') ||
      line.startsWith('NOTE') ||
      line.startsWith('STYLE')
    ) {
      continue;
    }

    // Kiểm tra dòng chứa mốc thời gian
    const match = line.match(timeRegex);
    if (match) {
      if (activeTimeTag && activeTextSegments.length > 0) {
        entries.push({
          timeTag: activeTimeTag,
          text: activeTextSegments.join(' '),
        });
        activeTextSegments = [];
      }

      // match[1]: hours, match[2]: minutes, match[3]: seconds
      activeTimeTag = formatTimestampToMinutesSeconds(
        match[1],
        match[2],
        match[3],
      );
      continue;
    }

    // Nếu là số thứ tự cue trong file SRT (ví dụ: '1', '2', '45') và dòng tiếp theo là timestamp
    if (
      /^\d+$/.test(line) &&
      i + 1 < lines.length &&
      timeRegex.test(lines[i + 1])
    ) {
      continue;
    }

    // Làm sạch các thẻ HTML định dạng thường gặp trong SRT/VTT (ví dụ: <i>, </b>, <c.color>)
    const sanitizedText = line.replace(/<[^>]+>/g, '').trim();

    if (sanitizedText) {
      if (activeTimeTag) {
        activeTextSegments.push(sanitizedText);
      } else {
        // Trường hợp là file văn bản thường .txt không có timestamp
        activeTextSegments.push(sanitizedText);
      }
    }
  }

  // Đẩy phần tử cuối cùng nếu còn
  if (activeTimeTag && activeTextSegments.length > 0) {
    entries.push({
      timeTag: activeTimeTag,
      text: activeTextSegments.join(' '),
    });
  }

  if (entries.length > 0) {
    return entries.map((e) => `${e.timeTag} ${e.text}`).join('\n');
  }

  // Nếu không có mốc thời gian (file .txt thuần), trả về văn bản đã làm sạch
  return clean.trim();
}
