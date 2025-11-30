# 天気予報アプリ

モダンなデザインの天気予報Webアプリケーションです。

## 機能

- 都市名で天気情報を検索
- 現在の気温、体感温度、湿度、風速、気圧を表示
- 5日間の天気予報
- 検索履歴の保存（LocalStorage使用）
- レスポンシブデザイン
- アニメーション効果

## デモモード

現在はデモモードで動作しています。以下の都市で試せます：
- Tokyo
- London
- New York

## 実際のAPIを使用する場合

1. [OpenWeatherMap](https://openweathermap.org/api)でAPIキーを取得
2. `app.js`の`API_KEY`を実際のAPIキーに置き換え
3. `getWeather()`関数を実際のAPI呼び出しに変更

## 使用技術

- HTML5
- CSS3（Grid、Flexbox、アニメーション）
- Vanilla JavaScript
- LocalStorage API
- OpenWeatherMap API（デモデータで代替）

## 起動方法

ブラウザで`index.html`を開くだけです。サーバー不要で動作します。
