export const adRequestTemplate = (beachName: string, companyName: string, adminUrl: string) => `
<!DOCTYPE html>
<html>
  <body>
    <h2>New Advertisement Request</h2>
    <p>A new advertisement request has been submitted:</p>
    <ul>
      <li>Beach: ${beachName}</li>
      <li>Company: ${companyName}</li>
    </ul>
    <a href="${adminUrl}" style="background: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
      Review Request
    </a>
  </body>
</html>
`;

export const adApprovalTemplate = (beachName: string) => `
<!DOCTYPE html>
<html>
  <body>
    <h2>Advertisement Request Approved</h2>
    <p>Your advertisement request for ${beachName} has been approved.</p>
    <p>Your ad will be live within 24 hours.</p>
  </body>
</html>
`;

export const adRejectionTemplate = (beachName: string, reason: string) => `
<!DOCTYPE html>
<html>
  <body>
    <h2>Advertisement Request Status</h2>
    <p>Your advertisement request for ${beachName} was not approved.</p>
    <p>Reason: ${reason}</p>
  </body>
</html>
`; 