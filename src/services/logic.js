import { addMonths, addDays, isBefore, isAfter, parseISO, format, differenceInDays } from 'date-fns';

export const logic = {
  // Constants
  EXAM_INTERVAL_MONTHS: 6,
  DUE_WARNING_DAYS: 15,
  RETEST_INTERVAL_DAYS_DEFAULT: 7,

  // Date Helpers
  formatDate(date) {
    if (!date) return '';
    return format(date, 'yyyy-MM-dd');
  },

  calculateNextExamDue(lastExamDateStr) {
    if (!lastExamDateStr) return this.formatDate(new Date()); // If never examined, due now
    const lastDate = parseISO(lastExamDateStr);
    const nextDate = addMonths(lastDate, this.EXAM_INTERVAL_MONTHS);
    return this.formatDate(nextDate);
  },

  isDueSoon(nextExamDateStr) {
    if (!nextExamDateStr) return true;
    const nextDate = parseISO(nextExamDateStr);
    const today = new Date();
    const diff = differenceInDays(nextDate, today);
    return diff <= this.DUE_WARNING_DAYS && diff >= 0;
  },

  isOverdue(nextExamDateStr) {
    if (!nextExamDateStr) return true;
    const nextDate = parseISO(nextExamDateStr);
    const today = new Date();
    // Check if nextDate is strictly before today (ignoring time)
    return isBefore(nextDate, today) && differenceInDays(today, nextDate) > 0;
  },

  calculateRetestDate(treatmentStartDateStr, days = 7) {
    const startDate = parseISO(treatmentStartDateStr);
    return this.formatDate(addDays(startDate, days));
  },

  recalculateWorkerStatus(exams) {
    if (!exams || exams.length === 0) {
      // No exams = Due immediately
      return { last_exam_date: null, next_exam_due: this.formatDate(new Date()) };
    }

    // Sort exams by date desc (newest first)
    // We parseISO to ensure correct comparison
    const sortedExams = [...exams].sort((a, b) => parseISO(b.exam_date) - parseISO(a.exam_date));
    
    const lastExam = sortedExams[0];
    const lastExamDate = lastExam.exam_date;

    // Find latest finalized exam (Apte, Apte Partielle, or Inapte) for periodic calculation
    // We treat any finalized decision as a "visit" that resets the periodic clock.
    const lastValidExam = sortedExams.find(e => e.decision && ['apte', 'apte_partielle', 'inapte'].includes(e.decision.status));
    
    let nextDue;
    if (lastValidExam) {
         const status = lastValidExam.decision.status;
         
         if (status === 'apte') {
             // Standard 6-month cycle
             nextDue = this.calculateNextExamDue(lastValidExam.exam_date);
         } else if (['inapte', 'apte_partielle'].includes(status)) {
             // Use retest date if available
             if (lastValidExam.treatment && lastValidExam.treatment.retest_date) {
                 nextDue = lastValidExam.treatment.retest_date;
             } else {
                 // Fallback if no retest date specified: Default to 7 days
                 nextDue = this.calculateRetestDate(lastValidExam.exam_date, 7);
             }
         } else {
             // Fallback
             nextDue = this.calculateNextExamDue(lastValidExam.exam_date);
         }
    } else {
         // If no finalized exam found (only Open), and we have history, 
         // arguably they are due for a valid exam now.
         nextDue = this.formatDate(new Date());
    }

    return { last_exam_date: lastExamDate, next_exam_due: nextDue };
  },

  // Dashboard Aggregation
  getDashboardStats(workers, exams) {
    const today = new Date();
    
    // 1. Due within 15 days
    const dueSoon = workers.filter(w => this.isDueSoon(w.next_exam_due) && !this.isOverdue(w.next_exam_due));
    
    // 2. Overdue
    const overdue = workers.filter(w => this.isOverdue(w.next_exam_due));
    
    // 3. Positive / Inapte cases (Active)
    // Find latest exam for each worker
    const activePositive = [];
    const retests = [];

    workers.forEach(w => {
      // Find exams for this worker
      const workerExams = exams.filter(e => e.worker_id === w.id);
      // Sort by date desc
      workerExams.sort((a, b) => new Date(b.exam_date) - new Date(a.exam_date));
      
      if (workerExams.length > 0) {
        const lastExam = workerExams[0];
        // Check if latest result is positive
        if (lastExam.lab_result && lastExam.lab_result.result === 'positive') {
          activePositive.push({ worker: w, exam: lastExam });
          
          // Check for scheduled re-test
          if (lastExam.treatment && lastExam.treatment.retest_date) {
             retests.push({ worker: w, exam: lastExam, date: lastExam.treatment.retest_date });
          }
        }
      }
    });

    // Sort retests by date
    retests.sort((a, b) => new Date(a.date) - new Date(b.date));

    return {
      dueSoon,
      overdue,
      activePositive,
      retests
    };
  }
};
