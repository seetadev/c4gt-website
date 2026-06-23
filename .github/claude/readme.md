# C4GT Website

A comprehensive Flask-based web application with spreadsheet interoperability features, cloud integration, and multi-service deployment capabilities. This project provides a robust platform for data management, user authentication, and file processing with extensive Excel/spreadsheet handling capabilities.

## 🚀 Features

- **Spreadsheet Management**: Advanced Excel/CSV import/export functionality with PHP interoperability
- **Cloud Integration**: Built-in authentication and storage services
- **Multi-Service Architecture**: Support for horizontal scaling with multiple Gunicorn workers
- **Containerized Deployment**: Docker and Docker Compose ready with MySQL database
- **User Authentication**: Secure user management and authentication system
- **Data Visualization**: Integrated Highcharts support for data visualization
- **File Processing**: Comprehensive file handling for various formats (XLS, XLSX, CSV, TXT)
- **Web Interface**: Responsive web interface with modern styling
- **CI/CD Integration**: GitHub Actions workflows for automated testing, security auditing, and code generation

## 🛠️ Tech Stack

### Backend
- **Python 3.9**: Core application runtime
- **Flask**: Web framework for API and web interface
- **Gunicorn**: WSGI HTTP Server for production deployment
- **MySQL 8.0**: Primary database for data persistence
- **PHP**: Excel interoperability and file processing

### Frontend
- **HTML5/CSS3**: Modern web interface
- **JavaScript**: Client-side functionality and interactions
- **Highcharts**: Data visualization and charting library
- **Responsive Design**: Mobile-friendly interface

### Development Tools
- **Docker & Docker Compose**: Containerization and orchestration
- **Nginx**: Reverse proxy and load balancing
- **Composer**: PHP dependency management
- **virtualenv**: Python environment isolation
- **GitHub Actions**: CI/CD pipeline automation

### Cloud & DevOps
- **AWS Integration**: Cloud storage and authentication services
- **Multi-port Deployment**: Load balancing across ports 8000-8003
- **Health Checks**: Container and service monitoring

## 📁 Project Structure

```
c4gt-website/
├── cloud/                    # Cloud services (authentication, storage)
├── route_handlers/           # Flask route handlers and API endpoints
├── excelinterop/            # PHP-based Excel processing tools
├── static/                  # Static assets (CSS, JS, images)
├── templates/               # HTML templates for Flask
├── configs/                 # Configuration files (nginx.conf)
├── .github/workflows/       # GitHub Actions CI/CD workflows
├── main.py                  # Flask application entry point
├── docker-compose.yml       # Docker services configuration
├── Dockerfile              # Container build configuration
└── requirements.txt        # Python dependencies
```

## 🔧 Installation & Setup

### Prerequisites
- Python 3.9+
- PHP 7.4+
- Composer
- Docker & Docker Compose (for containerized deployment)
- MySQL 8.0 (if running locally)
- Git

### Installation Steps

1. **Clone the repository**
```bash
git clone https://github.com/anisharma07/c4gt-website.git
cd c4gt-website
```

2. **Set up Python environment**
```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt
```

3. **Install PHP dependencies**
```bash
cd excelinterop
composer install
cd ..
```

4. **Configure environment variables**
```bash
# Create .env file
cp .env.example .env

# Edit .env file with your configuration
# Required variables:
# - MYSQL_PASSWORD
# - MYSQL_DATABASE
# - FLASK_APP=main.py
# - FLASK_ENV=development
```

## 🎯 Usage

### Development

**Local Development (Python only)**
```bash
# Activate virtual environment
source venv/bin/activate  # Linux/macOS
# or
venv\Scripts\activate     # Windows

# Run Flask development server
flask run --host=0.0.0.0 --port=5000
```

**With Docker Compose**
```bash
# Start all services (Flask app + MySQL)
docker-compose up --build

# Run in background
docker-compose up -d
```

### Production

**Multi-worker Production Deployment**
```bash
# Make run script executable
chmod +x run.sh

# Start multiple Gunicorn workers on different ports
./run.sh
```

**Docker Production**
```bash
# Build and deploy with Docker Compose
docker-compose -f docker-compose.yml up -d

# Scale the application
docker-compose scale app=3
```

### Excel Processing Features
- Import XLS/XLSX files through the web interface
- Export data to various spreadsheet formats
- Process CSV files with custom delimiters
- Batch file processing capabilities

## 📊 Platform Support

- **Web Browsers**: All modern browsers (Chrome, Firefox, Safari, Edge)
- **Operating Systems**: 
  - Windows 10/11
  - macOS 10.15+
  - Linux (Ubuntu 18.04+, CentOS 7+)
- **Mobile**: Responsive design supports mobile and tablet devices
- **Docker**: Any Docker-compatible platform

## 🧪 Testing

```bash
# Run application tests
npm test

# Docker health checks
docker-compose ps

# Test specific services
curl -f http://localhost:5000/
```

## 🔄 Deployment

### Docker Deployment
The application is configured for containerized deployment with:
- Multi-stage Docker builds for optimized images
- Health checks for both application and database
- Volume persistence for MySQL data
- Network isolation with custom bridge networks

### Cloud Deployment
- AWS integration ready with authentication and storage services
- Environment-based configuration for different deployment stages
- Support for load balancing across multiple application instances

### CI/CD Pipeline
GitHub Actions workflows provide:
- Automated code quality auditing
- Security vulnerability scanning
- Automated test generation
- PR review automation
- README generation and maintenance

## 🔒 Security Features

- Non-root user execution in containers
- Environment variable-based configuration
- MySQL connection security with health checks
- Input validation and sanitization
- Automated security auditing through GitHub Actions

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow PEP 8 for Python code styling
- Use meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Ensure Docker builds pass
- Test PHP interoperability features

### Code Quality
- Use the integrated GitHub Actions for automated code review
- Ensure all health checks pass
- Test both local and containerized deployments
- Validate Excel/CSV processing functionality

## 📄 License

This project is licensed under the ISC License. See the repository for more details.

## 🙏 Acknowledgments

- Flask community for the excellent web framework
- Highcharts for data visualization capabilities
- Docker for containerization platform
- MySQL for reliable database services
- PHP community for Excel processing libraries

## 📞 Support & Contact

- **Repository**: [https://github.com/anisharma07/c4gt-website](https://github.com/anisharma07/c4gt-website)
- **Issues**: [Report bugs and request features](https://github.com/anisharma07/c4gt-website/issues)
- **Discussions**: Use GitHub Discussions for questions and community support

For deployment issues, check the `ec2.md` file for AWS EC2 specific deployment instructions.

---

**Note**: This application includes extensive sample data files in the `excelinterop/tmp/` directory for testing Excel processing features. These files demonstrate the wide range of supported formats and use cases.