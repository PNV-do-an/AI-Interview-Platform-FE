# Build stage
FROM node:24-alpine AS build
WORKDIR /app
# Rỗng -> axios dùng đường dẫn tương đối /api/..., nginx trong container proxy sang backend
# API URL lấy từ .env.production trong repo (staging). ARG vẫn được chấp nhận
# để ghi đè khi build tay, nhưng không set ENV rỗng vì nó thắng .env.production.
ARG REACT_APP_API_URL
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Serve stage
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
