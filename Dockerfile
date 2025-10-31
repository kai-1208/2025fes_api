# ベースイメージとしてNode.jsの軽量版を選択
FROM node:18-alpine

# コンテナ内での作業ディレクトリを設定
WORKDIR /app

# package.jsonとpackage-lock.jsonを先にコピー
# これにより、ソースコードの変更だけではnpm installが再実行されなくなる
COPY package*.json ./

# 依存関係をインストール
RUN npm install

# プロジェクトのソースコードをすべてコピー
COPY . .

# アプリケーションが使用するポートを公開
EXPOSE 3000

# コンテナ起動時に実行するコマンド
CMD [ "node", "index.js" ]