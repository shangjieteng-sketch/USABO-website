const nodemailer = require('nodemailer');
const { BetaAnalyticsDataClient } = require('@google-analytics/data');
const cron = require('node-cron');

class AnalyticsReporter {
  constructor() {
    this.analyticsDataClient = new BetaAnalyticsDataClient({
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    });
    
    this.propertyId = process.env.GOOGLE_ANALYTICS_PROPERTY_ID;
    this.recipientEmail = 'tengshangjie00@gmail.com';
    
    // Setup email transporter
    this.emailTransporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });
  }

  async getAnalyticsData() {
    try {
      const [response] = await this.analyticsDataClient.runReport({
        property: `properties/${this.propertyId}`,
        dateRanges: [
          {
            startDate: '2daysAgo',
            endDate: 'today',
          },
        ],
        dimensions: [
          { name: 'country' },
          { name: 'deviceCategory' },
          { name: 'pagePath' },
        ],
        metrics: [
          { name: 'activeUsers' },
          { name: 'sessions' },
          { name: 'screenPageViews' },
          { name: 'averageSessionDuration' },
          { name: 'bounceRate' },
        ],
      });

      return this.formatAnalyticsData(response);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      throw error;
    }
  }

  formatAnalyticsData(response) {
    const report = {
      dateRange: '2 days ago to today',
      totalUsers: 0,
      totalSessions: 0,
      totalPageViews: 0,
      averageSessionDuration: 0,
      bounceRate: 0,
      topPages: [],
      deviceBreakdown: {},
      countryBreakdown: {}
    };

    response.rows?.forEach(row => {
      const dimensions = row.dimensionValues;
      const metrics = row.metricValues;
      
      const country = dimensions[0]?.value || 'Unknown';
      const deviceCategory = dimensions[1]?.value || 'Unknown';
      const pagePath = dimensions[2]?.value || 'Unknown';
      
      const activeUsers = parseInt(metrics[0]?.value || '0');
      const sessions = parseInt(metrics[1]?.value || '0');
      const pageViews = parseInt(metrics[2]?.value || '0');
      const sessionDuration = parseFloat(metrics[3]?.value || '0');
      const bounceRate = parseFloat(metrics[4]?.value || '0');

      // Aggregate totals
      report.totalUsers += activeUsers;
      report.totalSessions += sessions;
      report.totalPageViews += pageViews;
      
      // Track top pages
      const existingPage = report.topPages.find(p => p.path === pagePath);
      if (existingPage) {
        existingPage.views += pageViews;
        existingPage.users += activeUsers;
      } else {
        report.topPages.push({
          path: pagePath,
          views: pageViews,
          users: activeUsers
        });
      }
      
      // Device breakdown
      report.deviceBreakdown[deviceCategory] = (report.deviceBreakdown[deviceCategory] || 0) + sessions;
      
      // Country breakdown
      report.countryBreakdown[country] = (report.countryBreakdown[country] || 0) + activeUsers;
    });

    // Sort top pages by views
    report.topPages.sort((a, b) => b.views - a.views);
    report.topPages = report.topPages.slice(0, 10); // Top 10 pages

    // Calculate averages
    if (report.totalSessions > 0) {
      report.averageSessionDuration = response.rows?.reduce((sum, row) => {
        return sum + parseFloat(row.metricValues[3]?.value || '0');
      }, 0) / response.rows?.length || 0;
      
      report.bounceRate = response.rows?.reduce((sum, row) => {
        return sum + parseFloat(row.metricValues[4]?.value || '0');
      }, 0) / response.rows?.length || 0;
    }

    return report;
  }

  async sendReport() {
    try {
      const data = await this.getAnalyticsData();
      const htmlReport = this.generateHtmlReport(data);
      
      const mailOptions = {
        from: process.env.GMAIL_USER,
        to: this.recipientEmail,
        subject: `USABO Website Analytics Report - ${new Date().toLocaleDateString()}`,
        html: htmlReport
      };

      await this.emailTransporter.sendMail(mailOptions);
      console.log('Analytics report sent successfully to', this.recipientEmail);
      
    } catch (error) {
      console.error('Error sending analytics report:', error);
    }
  }

  generateHtmlReport(data) {
    const formatDuration = (seconds) => {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = Math.floor(seconds % 60);
      return `${minutes}m ${remainingSeconds}s`;
    };

    const formatPercentage = (value) => `${(value * 100).toFixed(1)}%`;

    return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background: #13547a; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .metric-box { background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 8px; padding: 15px; margin: 10px 0; display: inline-block; width: 200px; text-align: center; }
        .metric-value { font-size: 2em; font-weight: bold; color: #13547a; }
        .metric-label { color: #666; margin-top: 5px; }
        .section { margin: 20px 0; }
        .section h3 { color: #13547a; border-bottom: 2px solid #13547a; padding-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background: #f8f9fa; font-weight: bold; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🧬 USABO Website Analytics Report</h1>
        <p>Report Period: ${data.dateRange}</p>
        <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
    </div>
    
    <div class="content">
        <div class="section">
            <h2>📊 Key Metrics Overview</h2>
            <div class="metric-box">
                <div class="metric-value">${data.totalUsers}</div>
                <div class="metric-label">Total Users</div>
            </div>
            <div class="metric-box">
                <div class="metric-value">${data.totalSessions}</div>
                <div class="metric-label">Sessions</div>
            </div>
            <div class="metric-box">
                <div class="metric-value">${data.totalPageViews}</div>
                <div class="metric-label">Page Views</div>
            </div>
            <div class="metric-box">
                <div class="metric-value">${formatDuration(data.averageSessionDuration)}</div>
                <div class="metric-label">Avg Session Duration</div>
            </div>
            <div class="metric-box">
                <div class="metric-value">${formatPercentage(data.bounceRate)}</div>
                <div class="metric-label">Bounce Rate</div>
            </div>
        </div>

        <div class="section">
            <h3>🏆 Top 10 Most Visited Pages</h3>
            <table>
                <thead>
                    <tr>
                        <th>Page Path</th>
                        <th>Page Views</th>
                        <th>Unique Users</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.topPages.map((page, index) => `
                        <tr>
                            <td>${page.path}</td>
                            <td>${page.views}</td>
                            <td>${page.users}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <div class="section">
            <h3>📱 Device Breakdown</h3>
            <table>
                <thead>
                    <tr>
                        <th>Device Type</th>
                        <th>Sessions</th>
                    </tr>
                </thead>
                <tbody>
                    ${Object.entries(data.deviceBreakdown).map(([device, sessions]) => `
                        <tr>
                            <td>${device}</td>
                            <td>${sessions}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <div class="section">
            <h3>🌍 Top Countries</h3>
            <table>
                <thead>
                    <tr>
                        <th>Country</th>
                        <th>Users</th>
                    </tr>
                </thead>
                <tbody>
                    ${Object.entries(data.countryBreakdown)
                      .sort(([,a], [,b]) => b - a)
                      .slice(0, 10)
                      .map(([country, users]) => `
                        <tr>
                            <td>${country}</td>
                            <td>${users}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    </div>

    <div class="footer">
        <p>📧 This automated report is sent every 2 days at midnight.</p>
        <p>USABO Study Platform - <a href="https://usabo-website-prod.eba-cqd3je9y.us-east-1.elasticbeanstalk.com">Visit Website</a></p>
    </div>
</body>
</html>`;
  }

  // Schedule reports every 2 days at midnight
  startScheduledReports() {
    // Run every 2 days at midnight (0 0 */2 * *)
    cron.schedule('0 0 */2 * *', () => {
      console.log('Running scheduled analytics report...');
      this.sendReport();
    }, {
      timezone: "America/New_York" // Adjust timezone as needed
    });
    
    console.log('📊 Analytics reporting scheduled: Every 2 days at midnight');
  }

  // Manual report trigger for testing
  async sendTestReport() {
    console.log('Sending test analytics report...');
    await this.sendReport();
  }
}

module.exports = AnalyticsReporter;