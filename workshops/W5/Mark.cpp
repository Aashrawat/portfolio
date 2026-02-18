/***********************************************************************
// OOP244 Workshop 5: Mark Module
//
// File	Mark.cpp
// Version 1.0
// Date	2025/10/29
// Author	Aashrawat Shrestha
/////////////////////////////////////////////////////////////////
***********************************************************************/
#include <iostream>
#include <iomanip>
#include <cmath>
#include "Mark.h"
using namespace std;

namespace seneca {

    bool Mark::isValid() const {
        return (m_value >= 0 && m_value <= 100);
    }

    Mark::Mark(int value, char type) {
        *this = type;
        m_value = double(value);
    }

    Mark::Mark(double value) {
        m_type = MARK;
        m_value = value;
    }

    Mark& Mark::operator+=(const Mark& M) {
        m_value += M.m_value;
        return *this;
    }

    Mark& Mark::operator-=(const Mark& M) {
        m_value -= M.m_value;
        return *this;
    }

    Mark Mark::operator+(const Mark& M) const {
        return Mark(*this) += M;
    }

    Mark Mark::operator-(const Mark& M)const {
        return Mark(*this) -= M;
    }

    Mark& Mark::operator/=(int other) {
        m_value = m_value / other;
        return *this;
    }

    Mark Mark::operator/(int other) const {
        return Mark(m_value / other);
    }

    Mark& Mark::operator=(int value) {
        m_value = value;
        return *this;
    }

    Mark& Mark::operator=(char type) {
        m_type = MARK;
        if (type == GRADE || type == GPA) {
            m_type = type;
        }
        return *this;
    }

    double Mark::raw() const {
        return m_value;
    }

    Mark::operator int() const {
        int value = -1;
        if (isValid()) {
            value = int(std::round(m_value < 0 ? 0 : m_value));
        }
        return value;
    }

    Mark::operator bool() const {
        return isValid();
    }

    // returns the GPA (0-4) not the raw mark
    Mark::operator double() const {
        double gpa = 0;
        if (!isValid()) gpa = -1;
        else gpa = m_value * 0.04;
        return gpa;
    }

    Mark::operator const char* () const {
        char* grade = const_cast<char*>(m_grade);
        int value = int(*this);
        grade[1] = grade[2] = '\0';
        if (value < 0 || value > 100) grade[0] = 'X';
        else if (value >= 90) grade[0] = 'A', grade[1] = '+';
        else if (value >= 80) grade[0] = 'A';
        else if (value >= 75) grade[0] = 'B', grade[1] = '+';
        else if (value >= 70) grade[0] = 'B';
        else if (value >= 65) grade[0] = 'C', grade[1] = '+';
        else if (value >= 60) grade[0] = 'C';
        else if (value >= 55) grade[0] = 'D', grade[1] = '+';
        else if (value >= 50) grade[0] = 'D';
        else grade[0] = 'F';
        return m_grade;
    }

    // ================== display() ==================
    ostream& Mark::display(ostream& os) const {
        os.unsetf(ios::floatfield);

        if (!isValid()) {
            if (m_type == GRADE)
                os << "**";
            else
                os << "***";
        }
        else {
            if (m_type == GPA) {
                os << fixed << setprecision(1) << setw(3) << double(*this);
            }
            else if (m_type == MARK) {
                os.fill('_');
                os << right << setw(3) << int(*this);
            }
            else if (m_type == GRADE) {
                os.fill(' ');
                os << left << setw(3) << (const char*)(*this);
            }
        }
        os.fill(' ');
        return os;
    }

    // ================== display() helper ==================
    ostream& display(const Mark& M, char type, ostream& os) {
        Mark temp = M;
        temp = MARK;
        temp.display(os);
        if (type != MARK) {
            os << ": ";
            temp = type;
            temp.display(os);
        }
        return os;
    }

    // ================== operator<< ==================
    ostream& operator<<(ostream& os, const Mark& M) {
        return M.display(os);
    }

    // ================== operator>> (istream - cin) ==================
    istream& operator>>(istream& is, Mark& M) {
        int val{};
        bool valid = false;

        while (!valid) {
            if (!(is >> val)) {
                is.clear();
                is.ignore(10000, '\n');
                cout << "Invalid integer, try again.\n> ";
            }
            else {
                char next = is.peek();
                if (next != '\n' && next != EOF) {
                    is.ignore(10000, '\n');
                    cout << "Invalid trailing characters. Please enter only an integer.\n> ";
                }
                else if (val < 0 || val > 100) {
                    is.ignore(10000, '\n');
                    cout << "Invalid mark. Enter a value between 0 and 100.\n> ";
                }
                else {
                    is.ignore(10000, '\n');
                    M = val;
                    valid = true;
                }
            }
        }
        return is;
    }

    // ================== operator>> (ifstream - file) ==================
    ifstream& operator>>(ifstream& ifs, Mark& M) {
        int value{};
        char type{}, comma{};
        if (ifs >> value) {
            ifs >> comma >> type;
            if (ifs) {
                M = value;
                M = type;
            }
        }
        return ifs;
    }

    // ================== operator+ helpers ==================
    double operator+(double left, const Mark& right) {
        return left + right.raw();
    }

    int operator+(int left, const Mark& right) {
        return left + int(right);
    }

    // ================== operator- helpers ==================
    double operator-(double left, const Mark& right) {
        return left - right.raw();
    }

    int operator-(int left, const Mark& right) {
        return left - int(right);
    }

    // ================== friend operator/ helpers ==================
    double operator/(double value, const Mark& M) {
        return value / M.m_value;
    }

    int operator/(int value, const Mark& M) {
        return value / int(std::round(M.m_value));
    }
}