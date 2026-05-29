const vercelProjectOriginPattern =
  /^https:\/\/social-media-dashboard-[a-z0-9-]+-abhinavs-projects-461e7b95\.vercel\.app$/;

const getAllowedOrigins = () => {
  const configuredOrigins = [
    process.env.CLIENT_URL,
    process.env.CLIENT_URLS,
    'http://localhost:5173',
  ];

  return configuredOrigins
    .filter(Boolean)
    .flatMap((origin) => origin.split(','))
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean);
};

const isAllowedOrigin = (origin) => {
  if (!origin) {
    return true;
  }

  const normalizedOrigin = origin.replace(/\/$/, '');
  return getAllowedOrigins().includes(normalizedOrigin) || vercelProjectOriginPattern.test(normalizedOrigin);
};

const corsOrigin = (origin, callback) => {
  if (isAllowedOrigin(origin)) {
    callback(null, true);
    return;
  }

  callback(new Error(`Origin ${origin} is not allowed by CORS`));
};

module.exports = { corsOrigin, getAllowedOrigins, isAllowedOrigin };
