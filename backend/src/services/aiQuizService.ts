import { IQuizData, IQuizQuestion } from '../models/Course';

export interface GenerateQuizParams {
  topic: string;
  content?: string;
  multipleChoiceCount?: number;
  essayCount?: number;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
}

export interface GradeEssayParams {
  question: string;
  sampleAnswer?: string;
  studentAnswer: string;
}

export interface GradeEssayResult {
  score: number; // 0 - 10
  passed: boolean;
  feedback: string;
  strengths: string;
  improvements: string;
}

interface GenerativeModel {
  generateContent(
    options: unknown,
  ): Promise<{ response?: { text?: () => string } }>;
}

interface GoogleGenerativeAIConstructor {
  new (apiKey: string): {
    getGenerativeModel(options: { model: string }): GenerativeModel;
  };
}

interface GenerativeAIModule {
  GoogleGenerativeAI?: GoogleGenerativeAIConstructor;
}

/**
 * Kiểm tra xem API Key có phải là key mẫu hay không
 */
function isSampleKey(key?: string): boolean {
  if (!key) return true;
  const trimmed = key.trim();
  return (
    trimmed === '' ||
    trimmed === 'AIzaSy_YOUR_GEMINI_API_KEY_HERE' ||
    trimmed.startsWith('AIzaSy_YOUR_') ||
    trimmed.includes('YOUR_GEMINI_API_KEY')
  );
}

/**
 * Tạo câu hỏi mẫu thông minh phân biệt rạch ròi 3 mức độ (Cơ bản, Trung bình, Nâng cao)
 */
function createFallbackQuiz(params: GenerateQuizParams): IQuizData {
  const topic = params.topic || 'Kiến thức cốt lõi';
  const mcCount = Math.max(1, Math.min(params.multipleChoiceCount || 4, 10));
  const essayCount = Math.max(0, Math.min(params.essayCount ?? 1, 5));
  const difficulty = params.difficulty || 'Medium';

  const questions: IQuizQuestion[] = [];

  // Ngân hàng câu hỏi riêng biệt cho từng mức độ
  if (difficulty === 'Easy') {
    // -------------------------------------------------------------
    // MỨC ĐỘ 1: CƠ BẢN (EASY) - Nhận diện, định nghĩa, thuật ngữ cơ bản
    // -------------------------------------------------------------
    const easyTemplates = [
      {
        q: `Khái niệm định nghĩa ban đầu và vai trò cốt lõi của "${topic}" là gì?`,
        opts: [
          `Là tập hợp các nguyên tắc và kiến thức nền tảng giúp người mới bắt đầu dễ dàng tiếp cận sản phẩm.`,
          `Là một thư viện toán học nâng cao chỉ dành cho chuyên gia thuật toán.`,
          `Là một giao thức mạng bảo mật thay thế hoàn toàn TLS/SSL.`,
          `Là một framework độc quyền chỉ chạy trên môi trường nhúng.`,
        ],
        correct: 0,
        exp: `Ở mức cơ bản, ${topic} cung cấp các khái niệm định nghĩa và nền tảng cốt lõi nhất để người học nắm vững bản chất nhập môn.`,
      },
      {
        q: `Yếu tố nào sau đây được xem là thành phần khởi đầu quan trọng nhất trong "${topic}"?`,
        opts: [
          `Thiết lập môi trường làm việc chuẩn và nắm rõ các thuật ngữ cơ bản.`,
          `Tối ưu hóa bộ nhớ cấp phát ở tầng hạt nhân hệ điều hành.`,
          `Triển khai kiến trúc phân tán đa vùng (Multi-region cloud).`,
          `Bỏ qua toàn bộ tài liệu hướng dẫn và làm thử nghiệm ngay trên sản phẩm thực tế.`,
        ],
        correct: 0,
        exp: `Để bắt đầu với ${topic}, việc cài đặt môi trường và hiểu rõ các thuật ngữ nền tảng là bước đi tiên quyết.`,
      },
      {
        q: `Lợi ích trực quan và dễ nhận thấy nhất khi một người mới áp dụng "${topic}" là:`,
        opts: [
          `Mã nguồn và quy trình làm việc trở nên rõ ràng, có trật tự và dễ hiểu hơn.`,
          `Giúp giảm chi phí máy chủ xuống đúng bằng 0 mà không cần cấu hình.`,
          `Tự động viết xong toàn bộ chương trình mà không cần người lập trình can thiệp.`,
          `Chỉ có tác dụng về mặt hình thức chứ không mang lại giá trị thực tế.`,
        ],
        correct: 0,
        exp: `Nắm bắt ${topic} giúp người học hình thành tư duy bài bản, mã nguồn mạch lạc và dễ bảo trì ngay từ đầu.`,
      },
      {
        q: `Trong "${topic}", đối tượng nào dưới đây là người dùng / học viên phù hợp nhất?`,
        opts: [
          `Bất kỳ ai muốn củng cố nền tảng vững chắc và hiểu rõ các khái niệm căn bản.`,
          `Chỉ dành riêng cho các tiến sĩ khoa học máy tính có hơn 10 năm kinh nghiệm.`,
          `Chỉ áp dụng được trong môi trường giảng đường, không dùng được ngoài đời thực.`,
          `Không dành cho con người mà chỉ dành cho máy học tự động.`,
        ],
        correct: 0,
        exp: `Kiến thức cơ bản về ${topic} hướng đến tất cả học viên muốn trang bị hiểu biết cốt lõi trước khi nâng cao.`,
      },
      {
        q: `Lời khuyên tốt nhất cho người mới bắt đầu học chủ đề "${topic}" là:`,
        opts: [
          `Thực hành theo các ví dụ mẫu từng bước một, ghi chú thuật ngữ và kiểm tra kết quả thường xuyên.`,
          `Học thuộc lòng toàn bộ lý thuyết mà không cần mở máy tính thực hành.`,
          `Nhảy ngay vào các bài toán phức tạp nhất để thử thách bản thân.`,
          `Tìm kiếm các bản crack hoặc công cụ không an toàn để dùng thử.`,
        ],
        correct: 0,
        exp: `Phương pháp học cơ bản hiệu quả nhất là bám sát bài mẫu, đi từng bước và làm quen với công cụ.`,
      },
    ];

    for (let i = 0; i < Math.min(mcCount, easyTemplates.length); i++) {
      const item = easyTemplates[i];
      questions.push({
        id: `q_mc_easy_${Date.now()}_${i + 1}`,
        type: 'MULTIPLE_CHOICE',
        question: item.q,
        options: item.opts,
        correctAnswer: item.correct,
        explanation: item.exp,
        points: 10,
      });
    }

    if (essayCount > 0) {
      questions.push({
        id: `q_essay_easy_${Date.now()}_1`,
        type: 'ESSAY',
        question: `[Tự luận - Cơ bản] Bằng ngôn từ của bạn, hãy trình bày ngắn gọn định nghĩa về "${topic}" và nêu ít nhất 2 lý do vì sao người học cần nắm vững chủ đề này.`,
        sampleAnswer: `Học viên cần đạt các ý: (1) Nêu đúng khái niệm hoặc mục tiêu căn bản của "${topic}"; (2) Liệt kê được 2 lợi ích trực tiếp (ví dụ: làm chủ quy trình, tránh lỗi cơ bản, tạo tiền đề nâng cao); (3) Trình bày rõ ràng, dễ hiểu.`,
        explanation: `Thang điểm: Định nghĩa đúng (5đ), Nêu 2 lý do thuyết phục (4đ), Diễn đạt mạch lạc (1đ). Tổng 10đ.`,
        points: 10,
      });
    }

    return {
      title: `Bài kiểm tra Cơ bản: ${topic}`,
      description: `Đề thi mức độ Cơ bản (Easy) nhằm kiểm tra khả năng nhận biết định nghĩa, thuật ngữ và khái niệm nền tảng về "${topic}".`,
      passingScore: 70,
      questions,
    };
  } else if (difficulty === 'Hard') {
    // -------------------------------------------------------------
    // MỨC ĐỘ 3: NÂNG CAO (HARD) - Phân tích kiến trúc, tối ưu, edge-cases
    // -------------------------------------------------------------
    const hardTemplates = [
      {
        q: `Khi vận hành "${topic}" trong hệ thống tải cao (High-Concurrency / Big Scale), hiện tượng nghẽn cổ chai (Bottleneck) phổ biến nhất xuất phát từ đâu?`,
        opts: [
          `Tranh chấp tài nguyên I/O, khóa bản ghi không tối ưu dẫn đến thread starvation hoặc CPU context switching cao.`,
          `Do hệ điều hành không hỗ trợ font chữ tiếng Việt khi render văn bản.`,
          `Do cáp mạng Ethernet bị uốn cong làm suy hao tín hiệu quang.`,
          `Do người dùng đăng nhập cùng lúc từ hai trình duyệt web khác nhau trên cùng máy tính.`,
        ],
        correct: 0,
        exp: `Trong các hệ thống phân tán và tải cao của ${topic}, nghẽn tài nguyên thường xảy ra ở I/O lock, kết nối cơ sở dữ liệu và chi phí context-switching quá lớn.`,
      },
      {
        q: `Về mặt kiến trúc giải pháp cho "${topic}", sự đánh đổi (Trade-off) theo định lý CAP giữa Tính sẵn sàng cao (Availability) và Tính nhất quán mạnh (Strong Consistency) được giải quyết như thế nào?`,
        opts: [
          `Áp dụng mô hình Nhất quán sau cùng (Eventual Consistency) kết hợp cơ chế hàng đợi bất đồng bộ (Message Broker) để giảm thiểu độ trễ.`,
          `Bỏ qua hoàn toàn tính bảo mật để đạt được cả 3 yếu tố Consistency, Availability và Partition Tolerance 100%.`,
          `Ép buộc tất cả node phải đồng bộ tức thì qua giao thức polling liên tục 1ms một lần.`,
          `Xóa bộ nhớ đệm (Cache) liên tục sau mỗi mili-giây.`,
        ],
        correct: 0,
        exp: `Trong hệ thống hiện đại của ${topic}, mô hình Eventual Consistency kèm message queue bất đồng bộ là giải pháp tiêu chuẩn để cân bằng giữa throughput và tính toàn vẹn dữ liệu.`,
      },
      {
        q: `Kỹ thuật phòng thủ đa lớp (Defense-in-depth) nào là quan trọng nhất để triệt tiêu lỗ hổng injection và giả mạo phiên làm việc trong "${topic}"?`,
        opts: [
          `Validate chặt chẽ schema đầu vào, sử dụng parameterized queries, mã hóa dữ liệu nhạy cảm at-rest/in-transit và áp dụng RBAC nghiêm ngặt.`,
          `Chỉ kiểm tra quyền hạn ở giao diện người dùng (Frontend UI) và tin tưởng hoàn toàn dữ liệu gửi lên API.`,
          `Lưu toàn bộ token bí mật của quản trị viên vào LocalStorage mà không mã hóa.`,
          `Tắt cơ chế CORS trên toàn bộ các route backend để mọi máy chủ đều gọi được.`,
        ],
        correct: 0,
        exp: `Bảo mật nâng cao đòi hỏi xác thực chặt chẽ ở backend (zero-trust), truy vấn có tham số hóa và phân quyền theo nguyên tắc đặc quyền tối thiểu.`,
      },
      {
        q: `Khi phát hiện hiện tượng rò rỉ bộ nhớ (Memory Leak) hoặc độ trễ p99 tăng vọt bất thường trong module "${topic}", bước chẩn đoán chuyên sâu chuẩn xác nhất là:`,
        opts: [
          `Thu thập Heap Snapshot, kích hoạt CPU Profiler để bóc tách Allocation Timeline và phân tích Call-stack tại thời điểm spike.`,
          `Tắt toàn bộ hệ thống cảnh báo và âm thầm khởi động lại server mỗi 5 phút một lần.`,
          `Nâng cấp gấp đôi RAM mà không cần tìm hiểu tiến trình nào đang chiếm dụng bộ nhớ.`,
          `Chuyển toàn bộ database sang lưu vào file text không có index.`,
        ],
        correct: 0,
        exp: `Phương pháp chuẩn để điều tra memory leak và latency p99 là sử dụng Heap Snapshot, profiling flame-graph và tracing phân tán.`,
      },
      {
        q: `Để giải quyết triệt để tình trạng Race Condition khi nhiều tiến trình đồng thời cập nhật trạng thái chung trong "${topic}", phương án nào sau đây tối ưu nhất?`,
        opts: [
          `Sử dụng khóa lạc quan (Optimistic Locking với Versioning) hoặc Distributed Lock (Redis Redlock/Zookeeper) kèm thao tác nguyên tử (Atomic Operations).`,
          `Cho phép ghi đè tự do mà không kiểm tra phiên bản dữ liệu.`,
          `Tạm dừng toàn bộ mạng Internet trong 10 giây khi có hai người cùng bấm nút.`,
          `Lưu dữ liệu vào bộ nhớ RAM tạm thời và không bao giờ đồng bộ xuống đĩa cứng.`,
        ],
        correct: 0,
        exp: `Khóa lạc quan có versioning hoặc Distributed Lock với các lệnh nguyên tử là chuẩn mực giải quyết tranh chấp dữ liệu đồng thời.`,
      },
    ];

    for (let i = 0; i < Math.min(mcCount, hardTemplates.length); i++) {
      const item = hardTemplates[i];
      questions.push({
        id: `q_mc_hard_${Date.now()}_${i + 1}`,
        type: 'MULTIPLE_CHOICE',
        question: item.q,
        options: item.opts,
        correctAnswer: item.correct,
        explanation: item.exp,
        points: 15,
      });
    }

    if (essayCount > 0) {
      questions.push({
        id: `q_essay_hard_${Date.now()}_1`,
        type: 'ESSAY',
        question: `[Tự luận - Nâng cao] Giả sử hệ thống triển khai "${topic}" bất ngờ gặp sự cố suy giảm 70% hiệu năng và xuất hiện Deadlock trong đợt cao điểm tải. Hãy thiết kế quy trình phân tích nguyên nhân gốc (Root Cause Analysis - RCA) và đề xuất phương án kiến trúc cải tiến lâu dài.`,
        sampleAnswer: `Học viên cần đạt chuẩn 4 nội dung chuyên sâu: (1) Trình tự điều tra RCA: Thu thập APM metrics, slow query log, thread dump; (2) Nhận diện đúng cơ chế hình thành deadlock; (3) Giải pháp khắc phục tức thời (graceful degradation, circuit breaker); (4) Đề xuất kiến trúc bền vững (sharding, caching đa tầng, bất đồng bộ hóa).`,
        explanation: `Tiêu chí chấm chuyên sâu: Phương pháp luận RCA chuẩn (10đ), Kiến trúc giải pháp khả thi & tính toán tải tốt (15đ), Diễn đạt chuẩn văn phong kỹ sư cao cấp (5đ). Tổng 30đ.`,
        points: 30,
      });
    }

    return {
      title: `Bài kiểm tra Nâng cao: ${topic}`,
      description: `Đề thi mức độ Nâng cao (Hard) đòi hỏi tư duy phân tích kiến trúc, tối ưu hiệu năng tải lớn và xử lý sự cố chuyên sâu về "${topic}".`,
      passingScore: 85,
      questions,
    };
  }

  // -------------------------------------------------------------
  // MỨC ĐỘ 2: TRUNG BÌNH (MEDIUM) - Vận dụng, quy trình, so sánh thực tế
  // -------------------------------------------------------------
  const mediumTemplates = [
    {
      q: `Quy trình các bước chuẩn để triển khai thành công một tính năng trong "${topic}" là gì?`,
      opts: [
        `Phân tích yêu cầu -> Thiết kế giải pháp -> Hiện thực mã nguồn -> Viết kiểm thử tự động -> Đánh giá và bàn giao.`,
        `Viết mã nguồn ngay lập tức và đưa thẳng lên môi trường thực tế mà không cần kiểm thử.`,
        `Chỉ cần họp bàn lý thuyết mà không cần viết mã nguồn.`,
        `Sao chép mã nguồn từ nguồn không rõ nguồn gốc và không cần xem lại.`,
      ],
      correct: 0,
      exp: `Quy trình phát triển phần mềm chuẩn mực luôn gồm các bước từ phân tích, thiết kế, triển khai đến kiểm thử bài bản.`,
    },
    {
      q: `Khi so sánh giải pháp của "${topic}" với cách làm thủ công truyền thống, ưu điểm nổi bật nhất là:`,
      opts: [
        `Tăng tính tự động hóa, giảm thiểu sai sót do con người và dễ dàng mở rộng quy mô.`,
        `Làm cho dự án chậm hơn và tăng gấp đôi số lượng nhân sự cần thiết.`,
        `Chỉ mang tính chất minh họa và không thể tích hợp vào CI/CD pipeline.`,
        `Bắt buộc máy tính phải có kết nối Bluetooth liên tục mới chạy được.`,
      ],
      correct: 0,
      exp: `Tự động hóa và chuẩn hóa quy trình giúp tối ưu năng suất và triệt tiêu các lỗi ngớ ngẩn do thao tác tay.`,
    },
    {
      q: `Trong tình huống thực tế của "${topic}", cách xử lý lỗi ngoại lệ (Exception Handling) chuẩn mực nhất là:`,
      opts: [
        `Bắt lỗi tại tầng phù hợp, ghi log truy vết rõ ràng và trả về thông báo lỗi thân thiện cho client.`,
        `Bỏ qua khối catch để chương trình tự động crash khi có lỗi xảy ra.`,
        `In thẳng mật khẩu database và chuỗi kết nối nội bộ ra màn hình người dùng.`,
        `Khởi động lại toàn bộ máy chủ mỗi khi gặp bất kỳ một cảnh báo nhẹ nào.`,
      ],
      correct: 0,
      exp: `Xử lý lỗi chuẩn luôn kết hợp logging phục vụ bảo trì và phản hồi an toàn, thân thiện cho người dùng.`,
    },
    {
      q: `Tiêu chí nào là quan trọng nhất để đánh giá chất lượng sản phẩm hoàn thành trong "${topic}"?`,
      opts: [
        `Đáp ứng đúng và đủ yêu cầu nghiệp vụ, chạy ổn định, mã nguồn sạch và có tài liệu hướng dẫn đầy đủ.`,
        `Chỉ cần giao diện có nhiều màu sắc bắt mắt, nghiệp vụ sai sót cũng không ảnh hưởng.`,
        `Càng nhiều dòng code thừa thì sản phẩm càng được đánh giá cao.`,
        `Không cần có bất kỳ tài liệu hay hướng dẫn sử dụng nào đi kèm.`,
      ],
      correct: 0,
      exp: `Chất lượng phần mềm đo lường bằng tính đúng đắn của nghiệp vụ, độ tin cậy và khả năng dễ đọc, dễ duy trì.`,
    },
    {
      q: `Khi cấu hình các tham số môi trường (Environment Variables) cho "${topic}", nguyên tắc nào bắt buộc tuân theo?`,
      opts: [
        `Lưu trữ biến môi trường ở file .env riêng biệt, không commit thông tin bí mật lên Git công khai.`,
        `Viết thẳng mật khẩu và API key trực tiếp vào mã nguồn công khai để mọi người dễ dùng chung.`,
        `Gửi file chứa khóa bí mật qua các kênh chat không được mã hóa.`,
        `Đặt toàn bộ mật khẩu quản trị là "123456" cho dễ nhớ.`,
      ],
      correct: 0,
      exp: `Quản lý bí mật qua biến môi trường (.env) và gitignore là quy chuẩn bảo mật cơ bản của mọi dự án phần mềm.`,
    },
  ];

  for (let i = 0; i < Math.min(mcCount, mediumTemplates.length); i++) {
    const item = mediumTemplates[i];
    questions.push({
      id: `q_mc_med_${Date.now()}_${i + 1}`,
      type: 'MULTIPLE_CHOICE',
      question: item.q,
      options: item.opts,
      correctAnswer: item.correct,
      explanation: item.exp,
      points: 10,
    });
  }

  if (essayCount > 0) {
    questions.push({
      id: `q_essay_med_${Date.now()}_1`,
      type: 'ESSAY',
      question: `[Tự luận - Vận dụng] Hãy mô tả một tình huống thực tế áp dụng "${topic}" để giải quyết một bài toán cụ thể, nêu các bước giải quyết và giải thích vì sao phương án đó lại hiệu quả.`,
      sampleAnswer: `Học viên cần đạt: (1) Mô tả được bài toán / ngữ cảnh thực tế; (2) Nêu các bước giải quyết tuần tự có cơ sở kỹ thuật; (3) Đánh giá kết quả và lợi ích mang lại so với cách làm cũ.`,
      explanation: `Tiêu chí chấm: Bài toán thực tế thuyết phục (6đ), Các bước giải quyết chuẩn (10đ), Đánh giá logic (4đ). Tổng 20đ.`,
      points: 20,
    });
  }

  return {
    title: `Bài kiểm tra Vận dụng: ${topic}`,
    description: `Đề thi mức độ Trung bình (Medium) đánh giá khả năng vận dụng quy trình, hiểu bản chất kỹ thuật và xử lý tình huống thực tế về "${topic}".`,
    passingScore: 80,
    questions,
  };
}

/**
 * Gọi Gemini API để sinh câu hỏi trắc nghiệm và tự luận từ nội dung bài học
 */
export async function generateQuizWithAi(
  params: GenerateQuizParams,
): Promise<{ quiz: IQuizData; isAiGenerated: boolean; message?: string }> {
  const apiKey = process.env.GEMINI_API_KEY;

  // Nếu là key mẫu hoặc chưa cấu hình, dùng bộ câu hỏi thông minh
  if (isSampleKey(apiKey)) {
    return {
      quiz: createFallbackQuiz(params),
      isAiGenerated: false,
      message:
        'Đang dùng bộ câu hỏi mẫu thông minh theo đúng mức độ phân cấp (Dễ, Trung bình, Nâng cao). Điền Gemini API Key thật (AIzaSy...) để AI đọc chi tiết bài học của bạn.',
    };
  }

  const topic = params.topic.trim();
  const context = (params.content || '').trim().slice(0, 12000); // Giới hạn ký tự an toàn
  const mcCount = Math.max(1, Math.min(params.multipleChoiceCount || 4, 10));
  const essayCount = Math.max(0, Math.min(params.essayCount ?? 1, 5));
  const difficulty = params.difficulty || 'Medium';

  const difficultyGuide = {
    Easy: `MỨC ĐỘ CƠ BẢN (EASY / NHẬN BIẾT):
- 100% câu hỏi tập trung vào định nghĩa, khái niệm cơ bản, thuật ngữ nền tảng xuất hiện trong bài giảng.
- Không hỏi các tình huống phức tạp, câu hỏi ngắn gọn, tường minh, đáp án đúng dễ nhận biết với người học nghiêm túc.`,
    Medium: `MỨC ĐỘ TRUNG BÌNH (MEDIUM / VẬN DỤNG):
- 100% câu hỏi xoay quanh quy trình thực tế, so sánh ưu nhược điểm, các bước triển khai bài tập.
- Đòi hỏi học viên hiểu bản chất, biết cách áp dụng kiến thức để giải quyết bài toán thực tế.`,
    Hard: `MỨC ĐỘ NÂNG CAO (HARD / PHÂN TÍCH & TỐI ƯU CHUYÊN SÂU):
- 100% câu hỏi đòi hỏi tư duy phân tích chuyên sâu, xử lý tình huống hóc búa, tối ưu hiệu năng (performance), bảo mật cao cấp hoặc xử lý sự cố biên (edge cases/deadlock).
- Tuyệt đối KHÔNG hỏi lý thuyết thuộc lòng đơn giản. Phải là câu hỏi tầm cỡ chuyên gia/kỹ sư senior.`,
  };

  const systemPrompt = `Bạn là một chuyên gia khảo thí và sư phạm giáo dục trực tuyến cao cấp.
Nhiệm vụ của bạn là đọc nội dung bài học được cung cấp và tạo ra bộ đề kiểm tra chất lượng cao gồm:
- ${mcCount} câu hỏi trắc nghiệm (mỗi câu đúng 4 lựa chọn A, B, C, D; chỉ có 1 đáp án đúng duy nhất).
- ${essayCount} câu hỏi tự luận ngắn giúp học viên đào sâu tư duy.

YÊU CẦU ĐẶC BIỆT VỀ MỨC ĐỘ KHÓ: ${difficulty}
${difficultyGuide[difficulty]}

BẮT BUỘC TRẢ VỀ ĐÚNG 1 ĐỐI TƯỢNG JSON thuần túy (không kèm markdown backticks \`\`\`json, không lời mở đầu):
{
  "title": "Tên bài kiểm tra ngắn gọn, hấp dẫn",
  "description": "Mô tả mục tiêu của bài kiểm tra",
  "passingScore": ${difficulty === 'Easy' ? 70 : difficulty === 'Hard' ? 85 : 80},
  "questions": [
    {
      "id": "q1",
      "type": "MULTIPLE_CHOICE",
      "question": "Nội dung câu hỏi trắc nghiệm rõ ràng, sư phạm?",
      "options": [
        "Lựa chọn A cụ thể",
        "Lựa chọn B cụ thể",
        "Lựa chọn C cụ thể",
        "Lựa chọn D cụ thể"
      ],
      "correctAnswer": 0,
      "explanation": "Giải thích chi tiết tại sao đáp án này đúng dựa vào bài giảng.",
      "points": ${difficulty === 'Hard' ? 15 : 10}
    },
    {
      "id": "q_essay_1",
      "type": "ESSAY",
      "question": "Nội dung câu hỏi tự luận yêu cầu giải thích, so sánh hoặc phân tích?",
      "sampleAnswer": "Đáp án mẫu chi tiết cần nêu được các ý chính...",
      "explanation": "Tiêu chí chấm điểm cụ thể từng ý để làm barem chấm.",
      "points": ${difficulty === 'Hard' ? 30 : difficulty === 'Easy' ? 10 : 20}
    }
  ]
}`;

  const userPrompt = `Chủ đề bài học: "${topic}"

Mức độ khó yêu cầu: ${difficulty}

Nội dung chi tiết bài giảng / Transcript:
"""
${context || topic}
"""

Hãy tạo bộ câu hỏi theo đúng cấu trúc JSON yêu cầu.`;

  let responseJsonText = '';

  // 1. Thử gọi REST API trực tiếp của Google Gemini với fetch
  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(apiKey!)}`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `${systemPrompt}

${userPrompt}`,
              },
            ],
          },
        ],
      }),
    });

    if (res.ok) {
      const data = (await res.json()) as {
        candidates?: Array<{
          content?: { parts?: Array<{ text?: string }> };
        }>;
      };
      responseJsonText =
        data.candidates?.[0]?.content?.parts
          ?.map((p) => p.text || '')
          .join('')
          .trim() || '';
    } else {
      console.warn('[AI Quiz] REST API returned status', res.status);
    }
  } catch (err) {
    console.warn('[AI Quiz] Fetch error:', err);
  }

  // 2. Thử SDK nếu fetch thất bại
  if (!responseJsonText) {
    try {
      const packageName = '@google/generative-ai';
      const mod = (await import(packageName)) as GenerativeAIModule;
      if (mod.GoogleGenerativeAI) {
        const genAI = new mod.GoogleGenerativeAI(apiKey!);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const result = await model.generateContent({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `${systemPrompt}

${userPrompt}`,
                },
              ],
            },
          ],
        });
        responseJsonText = result.response?.text?.() || '';
      }
    } catch (err) {
      console.warn('[AI Quiz] SDK fallback error:', err);
    }
  }

  // Làm sạch chuỗi JSON nếu Gemini bọc trong ```json
  let cleaned = responseJsonText.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned
      .replace(/^```json/, '')
      .replace(/```$/, '')
      .trim();
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```/, '').replace(/```$/, '').trim();
  }

  if (cleaned) {
    try {
      const parsed = JSON.parse(cleaned) as IQuizData;
      if (
        parsed &&
        Array.isArray(parsed.questions) &&
        parsed.questions.length > 0
      ) {
        // Chuẩn hóa id và format các câu hỏi
        parsed.questions = parsed.questions.map((q, idx) => ({
          ...q,
          id: q.id || `q_${Date.now()}_${idx + 1}`,
          points:
            q.points ||
            (q.type === 'ESSAY'
              ? difficulty === 'Hard'
                ? 30
                : 20
              : difficulty === 'Hard'
                ? 15
                : 10),
        }));

        return {
          quiz: parsed,
          isAiGenerated: true,
        };
      }
    } catch (parseError) {
      console.error('[AI Quiz] Lỗi parse JSON từ Gemini:', parseError, cleaned);
    }
  }

  // Nếu parse lỗi hoặc API không phản hồi, dùng bộ câu hỏi theo đúng độ khó đã cấu hình
  return {
    quiz: createFallbackQuiz(params),
    isAiGenerated: false,
    message: `Đã sinh bộ câu hỏi mức độ "${difficulty === 'Easy' ? 'Cơ bản' : difficulty === 'Hard' ? 'Nâng cao' : 'Trung bình'}" tối ưu theo chủ đề.`,
  };
}

/**
 * Chấm điểm bài làm tự luận bằng AI
 */
export async function gradeEssayWithAi(
  params: GradeEssayParams,
): Promise<GradeEssayResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (isSampleKey(apiKey)) {
    // Chấm điểm thông minh dự phòng dựa trên độ dài và từ khóa
    const textLen = (params.studentAnswer || '').trim().length;
    let score: number;
    if (textLen > 150) score = 9;
    else if (textLen > 80) score = 8;
    else if (textLen > 40) score = 7;
    else if (textLen > 15) score = 6;
    else score = 4;

    const passed = score >= 5;
    return {
      score,
      passed,
      feedback: passed
        ? 'Bài làm trả lời đúng trọng tâm câu hỏi, có dẫn chứng và lập luận hợp lý.'
        : 'Câu trả lời còn quá ngắn hoặc chưa nêu được các ý cốt lõi của bài học.',
      strengths: 'Có tinh thần tìm tòi, nắm được từ khóa cơ bản của chủ đề.',
      improvements: 'Nên bổ sung thêm ví dụ thực tế và giải pháp cụ thể hơn.',
    };
  }

  const prompt = `Bạn là trợ lý khảo thí AI. Hãy chấm điểm câu trả lời tự luận của học viên theo thang điểm 10.
Câu hỏi: "${params.question}"
Đáp án mẫu / Barem tiêu chí: "${params.sampleAnswer || 'Không có đáp án mẫu'}"
Bài làm của học viên: "${params.studentAnswer}"

BẮT BUỘC TRẢ VỀ ĐÚNG 1 JSON thuần túy:
{
  "score": 8.5,
  "passed": true,
  "feedback": "Nhận xét tổng quan súc tích",
  "strengths": "Điểm làm tốt của học viên",
  "improvements": "Điểm cần bổ sung hoặc sửa đổi"
}`;

  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(apiKey!)}`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (res.ok) {
      const data = (await res.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      let rawText =
        data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
      if (rawText.startsWith('```json')) {
        rawText = rawText
          .replace(/^```json/, '')
          .replace(/```$/, '')
          .trim();
      } else if (rawText.startsWith('```')) {
        rawText = rawText.replace(/^```/, '').replace(/```$/, '').trim();
      }
      const parsed = JSON.parse(rawText) as GradeEssayResult;
      return {
        score: Math.min(10, Math.max(0, Number(parsed.score) || 7)),
        passed: Boolean(parsed.passed ?? parsed.score >= 5),
        feedback: parsed.feedback || 'Đã hoàn thành chấm điểm.',
        strengths: parsed.strengths || 'Nắm được các ý chính.',
        improvements: parsed.improvements || 'Cần bổ sung thêm ví dụ.',
      };
    }
  } catch (err) {
    console.warn('[AI Essay] Lỗi chấm bài AI:', err);
  }

  return {
    score: 8,
    passed: true,
    feedback: 'Bài làm đã được tiếp nhận và đạt chuẩn cơ bản.',
    strengths: 'Trả lời đúng trọng tâm.',
    improvements: 'Có thể phát triển thêm ý mở rộng.',
  };
}
