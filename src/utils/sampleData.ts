/**
 * BritConnect Default Reference Dataset Loader
 * Uses the attached 50-row UK telecoms sample dataset
 */

export const SAMPLE_CSV_PATH = '/assets/aistudio/BritConnect_Sample_Data_18445da0.csv';

export const SAMPLE_CSV_RAW = `Customer ID,Customer Segment,Age,Age Band,Gender,UK Nation,City,Acquisition Channel,Join Date,Tenure Months,Service Type,Plan Name,Contract Type,Contract Start Date,Contract End Date,Auto Renew,Monthly Charge GBP,Average Monthly Usage GB,Data Allowance GB,Overage Charges GBP,Discount Percent,Payment Method,Direct Debit,Late Payments 12M,Failed Payments 12M,Support Tickets 12M,Complaints 12M,Average Resolution Hours,Network Outages 12M,Satisfaction Score 1 10,NPS Score,Competitor Offer Received,Churn Status,Churn Date,Churn Reason,Lifetime Revenue GBP,Monthly Revenue At Risk GBP,Churn Flag
BCT-000001,Consumer,77,65+,Male,England,Liverpool,Retail Store,12/20/2023,28,Mobile,Mobile Plus,12 Months,12/29/2023,12/28/2024,No,25.06,67.2,100,0,0,Direct Debit,Yes,4,1,0,0,0,2,5,12,No,Churned,5/5/2026,Relocation,702.38,25.06,1
BCT-000002,Consumer,38,35-44,Female,England,Southampton,Referral,11/17/2025,11,Mobile + Broadband Bundle,Family Connect,12 Months,12/2/2025,12/2/2026,Yes,72.06,845.3,0,0,0,Direct Debit,Yes,0,0,1,0,6,1,9,39,Yes,Active,,,805.5,0,0
BCT-000003,Small Business,52,45-54,Male,Northern Ireland,Belfast,Telesales,8/25/2026,2,Home Broadband,Home Max,24 Months,9/7/2026,9/7/2028,Yes,37.63,191.6,0,0,15,Direct Debit,Yes,1,1,2,0,14.6,2,9,50,No,Active,,,88.5,0,0
BCT-000004,Consumer,71,65+,Female,England,Birmingham,Retail Store,4/25/2024,30,Home Broadband,Home 40,24 Months,5/8/2024,5/9/2026,No,25.34,437.6,0,0,15,Debit Card,No,1,0,0,0,0,3,10,58,No,Active,,,658.37,0,0
BCT-000005,Consumer,56,55-64,Male,England,Liverpool,Retail Store,10/15/2025,13,Mobile + Broadband Bundle,Family Connect,24 Months,10/22/2025,10/23/2027,No,73.47,182.5,0,0,10,Direct Debit,Yes,2,0,6,1,29.5,2,5,-9,Yes,Active,,,864.35,0,0
BCT-000006,Consumer,22,18-24,Male,England,Manchester,Digital Advertising,12/19/2024,22,Home Broadband,Home Max,24 Months,12/30/2024,12/31/2026,No,40.67,712.1,0,0,0,Credit Card,No,1,0,4,0,26.5,1,4,-21,No,Active,,,919.54,0,0
BCT-000007,Consumer,19,18-24,Female,England,Leeds,Telesales,10/29/2024,24,Mobile,Unlimited 5G,24 Months,11/13/2024,11/14/2026,No,34.57,17.9,999,0,10,Direct Debit,Yes,0,4,1,0,10,1,7,6,Yes,Active,,,752.31,0,0
BCT-000008,Consumer,21,18-24,Male,Scotland,Edinburgh,Partner,8/25/2026,2,Fibre Broadband,Fibre 100,Rolling Monthly,8/25/2026,9/24/2026,No,32.55,361.4,0,0,5,Direct Debit,Yes,0,0,2,0,20.1,1,10,56,Yes,Active,,,72.17,0,0
BCT-000009,Consumer,65,65+,Female,Scotland,Edinburgh,Retail Store,12/28/2025,10,Home Broadband,Home 80,12 Months,1/15/2026,1/15/2027,No,33.25,352,0,0,10,Credit Card,No,0,0,0,0,0,1,5,-15,No,Active,,,320.75,0,0
BCT-000010,Consumer,48,45-54,Male,England,Birmingham,Referral,6/22/2025,16,Mobile,Unlimited 5G,12 Months,7/10/2025,7/10/2026,No,37.87,10.5,999,0,5,Bank Transfer,No,3,0,1,0,7.9,0,7,13,No,Churned,10/20/2026,No Longer Needed,577.33,37.87,1
BCT-000011,Consumer,19,18-24,Male,England,Sheffield,Referral,2/25/2026,2,Mobile + Broadband Bundle,Family Connect,Rolling Monthly,2/25/2026,3/27/2026,No,72.71,680.1,0,0,0,Direct Debit,Yes,3,0,2,0,8.8,1,5,11,No,Churned,5/5/2026,Customer Service,165.84,72.71,1
BCT-000012,Consumer,24,18-24,Male,England,Leeds,Digital Advertising,3/30/2026,3,Home Broadband,Home 40,12 Months,4/18/2026,4/18/2027,No,24.94,719,0,0,0,Direct Debit,Yes,0,0,5,2,29.1,3,6,-5,No,Churned,6/25/2026,Relocation,78.91,24.94,1
BCT-000013,Consumer,69,65+,Female,England,Newcastle,Retail Store,7/13/2025,16,Home Broadband,Home 40,12 Months,7/23/2025,7/23/2026,No,24.28,456.5,0,0,0,Direct Debit,Yes,1,0,0,0,0,4,7,11,Yes,Active,,,404.4,0,0
BCT-000014,Consumer,75,65+,Male,Wales,Cardiff,Retail Store,3/26/2024,31,Fibre Broadband,Full Fibre 1G,24 Months,4/3/2024,4/4/2026,Yes,62.38,747.2,0,0,0,Direct Debit,Yes,0,0,2,0,17.3,1,9,65,Yes,Active,,,1954.37,0,0
BCT-000015,Consumer,39,35-44,Female,England,London,Website,1/16/2026,9,Mobile,Unlimited 5G,12 Months,1/25/2026,1/25/2027,No,37.76,48.2,999,0,0,Direct Debit,Yes,0,0,1,1,21.5,3,9,64,No,Active,,,358.34,0,0
BCT-000016,Consumer,62,55-64,Male,England,Sheffield,Telesales,8/20/2026,2,Home Broadband,Home 80,12 Months,8/25/2026,8/25/2027,Yes,27.95,694.7,0,0,0,Debit Card,No,0,2,1,0,6.8,2,9,64,No,Active,,,80.47,0,0
BCT-000017,Consumer,36,35-44,Female,England,Bristol,Retail Store,7/20/2026,3,Mobile + Broadband Bundle,Family Connect,12 Months,7/31/2026,7/31/2027,No,67.32,283.9,0,0,0,Direct Debit,Yes,0,0,0,0,0,4,5,-40,No,Active,,,209.7,0,0
BCT-000018,Consumer,34,25-34,Female,England,Manchester,Retail Store,5/30/2025,17,Home Broadband,Home 40,Rolling Monthly,5/30/2025,6/29/2025,No,23.29,610.5,0,0,20,Direct Debit,Yes,0,0,6,1,37.8,3,7,15,No,Active,,,337.53,0,0
BCT-000019,Consumer,59,55-64,Female,England,Manchester,Partner,11/16/2024,17,Fibre Broadband,Full Fibre 1G,24 Months,11/29/2024,11/30/2026,Yes,60.97,659.9,0,0,10,Direct Debit,Yes,2,0,4,0,12.9,2,7,7,No,Churned,4/14/2026,Price Increase,947.54,60.97,1
BCT-000020,Consumer,29,25-34,Male,England,London,Website,11/15/2024,23,Mobile,Unlimited 5G,12 Months,12/1/2024,12/1/2025,No,38.53,24.7,999,0,0,Direct Debit,Yes,0,0,2,0,19.4,3,5,0,No,Active,,,892.65,0,0
BCT-000021,Consumer,50,45-54,Female,England,Manchester,Retail Store,2/21/2024,32,Mobile,Unlimited 5G,24 Months,3/11/2024,3/12/2026,Yes,33.79,76.2,999,0,0,Credit Card,No,0,1,2,0,12.7,1,7,39,No,Active,,,1090.04,0,0
BCT-000022,Small Business,77,65+,Male,England,Southampton,Retail Store,7/17/2026,3,Fibre Broadband,Full Fibre 1G,Rolling Monthly,7/17/2026,8/16/2026,No,57.89,629.3,0,0,15,Debit Card,No,5,0,1,1,22,0,7,29,No,Active,,,151.85,0,0
BCT-000023,Consumer,60,55-64,Male,England,Bristol,Retail Store,6/23/2025,16,Mobile,Unlimited 5G,12 Months,6/27/2025,6/27/2026,No,33.32,82.2,999,0,0,Direct Debit,Yes,1,1,0,0,0,2,10,53,No,Active,,,542.49,0,0
BCT-000024,Consumer,20,18-24,Male,England,Sheffield,Telesales,1/21/2024,33,Mobile,Mobile Plus,Rolling Monthly,1/21/2024,2/20/2024,Yes,22.98,17.7,100,0,15,Credit Card,No,0,1,3,2,35,2,8,82,No,Active,,,665.29,0,0
BCT-000025,Consumer,60,55-64,Female,England,Sheffield,Retail Store,1/15/2025,21,Home Broadband,Home Max,12 Months,1/20/2025,1/20/2026,Yes,41.57,183.7,0,0,20,Direct Debit,Yes,3,0,3,0,23.4,1,10,86,No,Active,,,706.49,0,0
BCT-000026,Consumer,36,35-44,Female,England,Newcastle,Digital Advertising,1/30/2025,21,Fibre Broadband,Full Fibre 1G,Rolling Monthly,1/30/2025,3/1/2025,Yes,62.96,376.7,0,0,0,Direct Debit,Yes,0,0,3,0,16.2,0,9,54,No,Active,,,1323.32,0,0
BCT-000027,Small Business,69,65+,Female,England,Sheffield,Telesales,12/21/2023,23,Mobile + Broadband Bundle,Connect Duo,24 Months,1/8/2024,1/8/2026,No,48.52,340.4,0,0,0,Direct Debit,Yes,0,0,8,0,28.3,4,5,-11,No,Churned,11/29/2025,Competitor Offer,1127.17,48.52,1
BCT-000028,Consumer,64,55-64,Male,England,Nottingham,Website,7/23/2026,3,Mobile,SIM Essentials,24 Months,7/29/2026,7/29/2028,No,13.11,12.8,20,0,0,Direct Debit,Yes,0,0,0,0,0,1,7,57,Yes,Active,,,48.79,0,0
BCT-000029,Consumer,72,65+,Male,Wales,Swansea,Referral,4/25/2025,18,Mobile,Mobile Plus,24 Months,4/27/2025,4/28/2027,Yes,21.64,31.5,100,0,0,Credit Card,No,3,0,0,0,0,0,7,20,No,Active,,,407.53,0,0
BCT-000030,Consumer,39,35-44,Female,England,Birmingham,Retail Store,5/21/2024,29,Mobile + Broadband Bundle,Connect Duo,12 Months,5/22/2024,5/22/2025,No,50.56,768.2,0,0,0,Direct Debit,Yes,3,0,5,0,25.3,1,6,33,No,Active,,,1483.61,0,0
BCT-000031,Small Business,31,25-34,Male,England,Bristol,Referral,8/31/2025,14,Home Broadband,Home Max,24 Months,9/15/2025,9/16/2027,No,38.11,747.8,0,0,0,Direct Debit,Yes,1,0,0,0,0,0,6,39,No,Active,,,556.18,0,0
BCT-000032,Consumer,58,55-64,Prefer not to say,England,Newcastle,Telesales,5/20/2025,17,Fibre Broadband,Fibre 100,24 Months,6/7/2025,6/8/2027,No,27.13,858.1,0,0,0,Direct Debit,Yes,0,0,1,0,6.9,2,8,45,No,Active,,,465.59,0,0
BCT-000033,Small Business,77,65+,Male,England,Sheffield,Partner,8/27/2026,2,Mobile,SIM Essentials,24 Months,9/8/2026,9/8/2028,Yes,13.11,72.4,20,13.62,0,Direct Debit,Yes,2,0,3,2,25.2,1,4,-29,No,Active,,,41.54,0,0
BCT-000034,Small Business,26,25-34,Female,England,Newcastle,Referral,1/12/2026,10,Mobile + Broadband Bundle,Family Connect,24 Months,1/27/2026,1/28/2028,Yes,65.39,465.4,0,0,0,Direct Debit,Yes,0,0,1,1,19.4,4,7,34,Yes,Active,,,665.85,0,0
BCT-000035,Consumer,70,65+,Female,England,Manchester,Telesales,7/29/2025,7,Fibre Broadband,Full Fibre 1G,24 Months,8/14/2025,8/15/2027,Yes,52.14,356.5,0,0,0,Debit Card,No,1,0,1,0,19.5,4,9,42,No,Churned,3/1/2026,Customer Service,369.19,52.14,1
BCT-000036,Small Business,54,45-54,Male,England,Leeds,Website,12/14/2025,11,Mobile,Mobile Plus,24 Months,12/20/2025,12/21/2027,Yes,24.34,63.3,100,0,5,Debit Card,No,1,0,0,0,0,1,8,14,No,Active,,,264.34,0,0
BCT-000037,Consumer,41,35-44,Female,Scotland,Edinburgh,Website,4/22/2026,6,Mobile,Mobile Plus,24 Months,5/6/2026,5/6/2028,Yes,24.81,73.9,100,0,10,Direct Debit,Yes,0,0,1,0,12.1,2,7,20,Yes,Active,,,136.84,0,0
BCT-000038,Consumer,60,55-64,Female,England,Birmingham,Partner,12/28/2025,10,Fibre Broadband,Fibre 500,24 Months,1/6/2026,1/7/2028,No,46.63,785.6,0,0,0,Direct Debit,Yes,0,0,0,0,0,2,8,47,No,Active,,,476.35,0,0
BCT-000039,Consumer,39,35-44,Female,England,Manchester,Telesales,6/26/2025,11,Fibre Broadband,Full Fibre 1G,Rolling Monthly,6/26/2025,7/26/2025,Yes,60.05,349.5,0,0,5,Direct Debit,Yes,0,1,6,1,31.3,1,6,23,No,Churned,6/5/2026,Relocation,649.3,60.05,1
BCT-000040,Small Business,67,65+,Male,Wales,Cardiff,Partner,1/12/2026,10,Mobile,Unlimited 5G,24 Months,1/17/2026,1/18/2028,No,34.04,5.7,999,0,10,Direct Debit,Yes,0,0,2,1,25.8,3,5,19,No,Active,,,323.19,0,0
BCT-000041,Consumer,41,35-44,Female,England,Bristol,Digital Advertising,7/19/2025,13,Mobile,Unlimited 5G,Rolling Monthly,7/19/2025,8/18/2025,Yes,40.34,17.2,999,0,10,Direct Debit,Yes,0,0,0,0,0,2,6,-12,No,Churned,8/14/2026,Customer Service,495.82,40.34,1
BCT-000042,Consumer,49,45-54,Female,England,Manchester,Website,4/19/2025,13,Home Broadband,Home Max,Rolling Monthly,4/19/2025,5/19/2025,No,43.59,210,0,0,20,Direct Debit,Yes,0,0,7,0,23.8,0,9,82,No,Churned,5/24/2026,Competitor Offer,469.87,43.59,1
BCT-000043,Consumer,78,65+,Female,England,Newcastle,Digital Advertising,12/28/2023,34,Mobile + Broadband Bundle,Premium Bundle,Rolling Monthly,12/28/2023,1/27/2024,Yes,90.14,871.6,0,0,0,Direct Debit,Yes,4,0,1,0,16.3,2,9,86,Yes,Active,,,3069.83,0,0
BCT-000044,Consumer,47,45-54,Male,England,Newcastle,Digital Advertising,2/26/2025,20,Mobile,Mobile Plus,12 Months,2/27/2025,2/27/2026,Yes,23.02,7.9,100,0,0,Direct Debit,Yes,0,0,0,0,0,0,5,-24,No,Active,,,475.9,0,0
BCT-000045,Consumer,67,65+,Female,England,Nottingham,Partner,5/18/2025,17,Fibre Broadband,Full Fibre 1G,Rolling Monthly,5/18/2025,6/17/2025,No,61.56,87.9,0,0,5,Debit Card,No,0,0,3,1,27.7,1,8,64,No,Active,,,1012.82,0,0
BCT-000046,Consumer,49,45-54,Male,Wales,Newport,Partner,8/23/2024,26,Home Broadband,Home 40,12 Months,8/28/2024,8/28/2025,No,21.89,855.1,0,0,10,Credit Card,No,0,0,1,1,16.8,0,7,28,No,Active,,,535.73,0,0
BCT-000047,Consumer,30,25-34,Male,England,Nottingham,Retail Store,9/13/2025,5,Home Broadband,Home 80,12 Months,10/3/2025,10/3/2026,No,30.32,658.9,0,0,10,Bank Transfer,No,5,1,1,0,7,0,8,41,Yes,Churned,2/5/2026,Competitor Offer,152.37,30.32,1
BCT-000048,Consumer,31,25-34,Male,Wales,Swansea,Digital Advertising,1/13/2026,10,Mobile,Mobile Plus,12 Months,1/20/2026,1/20/2027,No,21.25,20.3,100,0,20,Credit Card,No,1,0,2,0,20.4,3,7,12,No,Active,,,175.47,0,0
BCT-000049,Consumer,34,25-34,Male,England,Southampton,Website,7/25/2024,27,Home Broadband,Home Max,24 Months,7/31/2024,8/1/2026,No,43.92,612.1,0,0,0,Direct Debit,Yes,1,1,7,0,30.6,2,6,5,Yes,Active,,,1202.3,0,0
BCT-000050,Consumer,33,25-34,Male,Northern Ireland,Belfast,Referral,2/25/2024,32,Mobile,Mobile Plus,12 Months,3/13/2024,3/13/2025,No,22.96,21.1,100,0,20,Debit Card,No,0,0,1,0,7.4,2,10,51,No,Active,,,608.42,0,0`;

export async function fetchSampleData(): Promise<string> {
  try {
    const res = await fetch(SAMPLE_CSV_PATH);
    if (res.ok) {
      const text = await res.text();
      if (text && text.includes('BCT-000001')) {
        return text;
      }
    }
  } catch (err) {
    console.warn('Could not fetch external sample csv, using embedded reference dataset', err);
  }
  return SAMPLE_CSV_RAW;
}
