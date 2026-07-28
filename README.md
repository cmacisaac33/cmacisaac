# Notewise - Book & Podcast Tracker

A clean, mobile-friendly web app for tracking books and podcasts with notes, ratings, and progress.

## Features

- **Track Books & Podcasts**: Add and manage your reading and listening library
- **Take Notes**: Capture thoughts and insights as you go
- **Rate & Review**: 5-star rating system with optional reviews
- **Track Progress**: Mark items as in-progress or finished
- **Search & Filter**: Find items by title, notes, type, status, or genre
- **Organize by Genre**: Categorize your content for easy browsing
- **Mobile-First Design**: Responsive interface optimized for phones and tablets
- **Offline Storage**: All data stored locally in your browser (localStorage)

## Getting Started

### Installation

1. Clone this repository:
```bash
git clone https://github.com/cmacisaac33/cmacisaac.git
cd cmacisaac
```

2. Open `index.html` in your web browser, or serve it with a local server:
```bash
# Using Python 3
python -m http.server 8000

# Using Node.js
npx http-server
```

3. Navigate to `http://localhost:8000` in your browser.

### Usage

1. **Add an Item**: Click the "+" button to add a new book or podcast
2. **Fill in Details**: Enter title, genre, and optionally add notes and ratings
3. **Manage Items**: Click any item to view/edit details or add notes
4. **Search**: Use the search bar to filter by title or note content
5. **Filter**: Use dropdowns to filter by type, status, or genre

## Project Structure

```
my-tracker-app/
├── index.html          # Main HTML structure
├── styles.css          # Application styling
├── js/
│   ├── main.js        # Core application logic and UI
│   └── storage.js     # LocalStorage data management
└── README.md          # This file
```

## Technology Stack

- **HTML5**: Semantic markup
- **CSS3**: Modern styling with CSS variables, flexbox, and grid
- **Vanilla JavaScript**: No frameworks required
- **LocalStorage API**: Client-side data persistence

## Browser Support

Works in all modern browsers that support:
- ES6+ JavaScript
- CSS Grid & Flexbox
- LocalStorage API

## Data Storage

All data is stored locally in your browser using the LocalStorage API. Your data:
- Stays on your device
- Persists between sessions
- Is not sent to any server
- Can be cleared through browser settings

## Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Author

Built with Claude Code
