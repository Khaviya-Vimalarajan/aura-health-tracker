import { jsPDF } from 'jspdf';

export const generateWeeklyPDF = (weeklyLogs, user) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const primaryColor = [16, 185, 129]; // #10B981 Emerald
  const textColor = [17, 24, 39]; // #111827 Gray-900
  const secondaryTextColor = [107, 114, 128]; // #6B7280 Gray-500
  const lightBgColor = [249, 250, 251]; // #F9FAFB Gray-50
  
  // Set Document Title
  doc.setProperties({
    title: 'Aura Health Weekly Report',
    subject: 'Weekly Health Analytics Summary',
    author: 'Aura Health Tracker',
    keywords: 'aura, health, metrics, sleep, hydration, steps'
  });

  // PAGE HEADER
  // Draw primary color header bar
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 35, 'F');
  
  // Header text
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('AURA HEALTH REPORT', 15, 20);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Your glow dashboard & habits summary', 15, 26);
  
  // USER METADATA
  const todayStr = new Date().toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });
  
  doc.setTextColor(...textColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`User Profile: ${user?.name || 'Aura Guest'}`, 15, 48);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated On: ${todayStr}`, 15, 54);
  
  // Draw divider line
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.5);
  doc.line(15, 60, 195, 60);

  // SECTION 1: WEEKLY STATISTICS SUMMARY
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...primaryColor);
  doc.text('Weekly Averages', 15, 70);

  // Compute Averages
  const logCount = weeklyLogs.length;
  const avgSleep = logCount ? (weeklyLogs.reduce((acc, c) => acc + (c.sleepHours || 0), 0) / logCount).toFixed(1) : 0;
  const avgWater = logCount ? Math.round(weeklyLogs.reduce((acc, c) => acc + (c.waterIntake || 0), 0) / logCount) : 0;
  const avgSteps = logCount ? Math.round(weeklyLogs.reduce((acc, c) => acc + (c.steps || 0), 0) / logCount) : 0;
  const avgEnergy = logCount ? Math.round(weeklyLogs.reduce((acc, c) => acc + (c.energyScore || 0), 0) / logCount) : 0;

  // Render Stats Grid
  doc.setFillColor(...lightBgColor);
  doc.rect(15, 75, 180, 25, 'F');
  doc.setDrawColor(229, 231, 235);
  doc.rect(15, 75, 180, 25, 'S');

  doc.setTextColor(...textColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Sleep Avg', 25, 84);
  doc.text('Hydration Avg', 70, 84);
  doc.text('Steps Avg', 120, 84);
  doc.text('Energy Avg', 165, 84);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...primaryColor);
  doc.text(`${avgSleep} hrs`, 25, 91);
  doc.text(`${avgWater} ml`, 70, 91);
  doc.text(`${avgSteps.toLocaleString()} steps`, 120, 91);
  doc.text(`${avgEnergy}%`, 165, 91);

  // SECTION 2: DAILY LOG DETAILS TABLE
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...primaryColor);
  doc.text('Daily Activity Log', 15, 115);

  // Table Headers
  const startY = 120;
  doc.setFillColor(...lightBgColor);
  doc.rect(15, startY, 180, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...textColor);
  
  doc.text('Date', 18, startY + 5.5);
  doc.text('Mood', 45, startY + 5.5);
  doc.text('Sleep', 75, startY + 5.5);
  doc.text('Water', 105, startY + 5.5);
  doc.text('Steps', 135, startY + 5.5);
  doc.text('Meditate / Walk / Diet', 160, startY + 5.5);

  doc.line(15, startY + 8, 195, startY + 8);

  // Table Rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...textColor);

  let currentY = startY + 8;
  
  const sortedLogs = [...weeklyLogs].reverse();

  sortedLogs.forEach((log, index) => {
    const logDate = new Date(log.date).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', weekday: 'short'
    });

    const mCount = log.habits?.meditated ? 'Yes' : 'No';
    const wCount = log.habits?.walked ? 'Yes' : 'No';
    const dCount = log.habits?.ateHealthy ? 'Yes' : 'No';
    const habitsStr = `${mCount} / ${wCount} / ${dCount}`;

    // Draw zebra striping
    if (index % 2 === 1) {
      doc.setFillColor(243, 244, 246); // Light gray striping
      doc.rect(15, currentY, 180, 7.5, 'F');
    }

    doc.setTextColor(...textColor);
    doc.text(logDate, 18, currentY + 5);
    doc.text(log.mood.toUpperCase(), 45, currentY + 5);
    doc.text(`${log.sleepHours} hrs`, 75, currentY + 5);
    doc.text(`${log.waterIntake} ml`, 105, currentY + 5);
    doc.text(log.steps.toLocaleString(), 135, currentY + 5);
    doc.text(habitsStr, 160, currentY + 5);

    currentY += 7.5;
  });

  // Bottom Border of table
  doc.line(15, currentY, 195, currentY);

  // SECTION 3: WELLNESS ADVICE
  const adviceY = currentY + 15;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...primaryColor);
  doc.text('Aura Wellness Recommendations', 15, adviceY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(...textColor);
  
  let recommendation = "";
  if (avgSleep < 7) {
    recommendation = "Your average sleep this week is below the recommended 7-8 hours. Try winding down 30 minutes earlier, turning off screens, and tracking a relaxation routine to improve energy.";
  } else if (avgSteps < 8000) {
    recommendation = "Your average steps are below 8,000 steps. Integrating a short 20-minute daily walk can help enhance cardiorespiratory fitness, boost your metabolism, and improve mood.";
  } else if (avgWater < 2000) {
    recommendation = "Hydration is key! Your water intake was lower this week. Keeping a full bottle nearby and drinking a cup right after waking up will boost your hydration levels and metabolic health.";
  } else {
    recommendation = "Outstanding work! You are meeting your sleep, hydration, and movement targets. Focus on keeping up the consistency, journaling regularly, and listening to your body's energy levels.";
  }

  doc.text(doc.splitTextToSize(recommendation, 175), 15, adviceY + 6);

  // FOOTER
  const footerY = 285;
  doc.setDrawColor(229, 231, 235);
  doc.line(15, footerY - 5, 195, footerY - 5);
  doc.setTextColor(...secondaryTextColor);
  doc.setFontSize(8);
  doc.text('Aura Health Tracker — Live well, log daily.', 15, footerY);
  doc.text('Page 1 of 1', 185, footerY);

  // Trigger Save
  doc.save(`aura-weekly-report-${new Date().toISOString().split('T')[0]}.pdf`);
};
