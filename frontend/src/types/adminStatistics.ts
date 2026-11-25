export interface MonthlyRevenuePoint {
  monthNumber: number;
  monthLabel: string;
  year: number;
  revenue: number;
  commissionRevenue: number;
  ordersCount: number;
  growthPercent: number;
  trend: 'UP' | 'DOWN' | 'FLAT';
}

export interface MonthlyInstructorPoint {
  monthNumber: number;
  monthLabel: string;
  year: number;
  newInstructors: number;
  cumulativeTotal: number;
  growthPercent: number;
  trend: 'UP' | 'DOWN' | 'FLAT';
}

export interface AIStabilityLogItem {
  id: string;
  timestamp: string;
  userType: 'STUDENT' | 'GUEST';
  userEmail?: string;
  requestType:
    | 'PERSONALIZED_FEED'
    | 'COURSE_SIMILARITY'
    | 'NEXT_SEQUENCE'
    | 'ONBOARDING_MATCH';
  latencyMs: number;
  engine:
    | 'SVD_COLLABORATIVE'
    | 'HYBRID_ML'
    | 'CONTENT_BASED'
    | 'NEXT_SEQUENCE'
    | 'HEURISTIC_COLDSTART';
  coursesCount: number;
  status: 'SUCCESS' | 'FALLBACK_OK';
  score: number;
}

export interface AIDailyStabilityItem {
  date: string;
  requestsCount: number;
  avgLatencyMs: number;
  successRate: number;
  ctrPercent: number;
  status: 'OPTIMAL' | 'NORMAL' | 'DEGRADED';
}

export interface AdminStatisticsData {
  summary: {
    currentYear: number;
    currentMonthNum: number;
    commissionPercent: number;
    totalUsers: number;
    totalInstructors: number;
    totalStudents: number;
    totalCoursesCount: number;
    totalAccumulatedRevenue: number;
    totalCommissionRevenue: number;
    currentMonthRevenue: number;
    lastMonthRevenue: number;
    revenueGrowthRate: number;
    totalPaidOrders: number;
    newInstructorsThisMonth: number;
    instructorGrowthRate: number;
    appStats: {
      total: number;
      pending: number;
      approved: number;
      rejected: number;
    };
  };
  revenueChart: {
    monthly: MonthlyRevenuePoint[];
    totalAccumulated: number;
    currentMonth: number;
    growthRate: number;
  };
  instructorChart: {
    monthly: MonthlyInstructorPoint[];
    totalInstructors: number;
    newThisMonth: number;
    growthRate: number;
  };
  aiStability: {
    engineStatus:
      'OPERATIONAL' | 'FALLBACK_ACTIVE' | 'DEGRADED' | 'MAINTENANCE';
    modelName: string;
    architecture?: string;
    trainingStatus?: 'TRAINED' | 'COLD_START' | 'READY_TO_TRAIN';
    interactionsTrained?: number;
    svdFactors?: number;
    pythonServiceOnline?: boolean;
    uptimePercent: number;
    avgLatencyMs: number;
    successRatePercent: number;
    ctrPercent: number;
    conversionPercent: number;
    totalRequestsCount: number;
    dailyStability: AIDailyStabilityItem[];
    recentLogs: AIStabilityLogItem[];
  };
}

export interface AdminStatisticsApiResponse {
  success: boolean;
  message?: string;
  data: AdminStatisticsData;
}
