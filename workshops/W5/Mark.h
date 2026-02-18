/***********************************************************************
// OOP244 Workshop 5: Mark Module
//
// File	Mark.h
// Version 1.0
// Date	2025/10/29
// Author	Aashrawat Shrestha
// Description: Full implementation according to Workshop #5
/////////////////////////////////////////////////////////////////
***********************************************************************/
#ifndef SENECA_MARK_H
#define SENECA_MARK_H

#include <iostream>
#include <fstream>

const char GPA = 'G';
const char MARK = 'M';
const char GRADE = 'R';

namespace seneca {
    class Mark {
        char m_grade[3]{};
        double m_value{};
        char m_type{ MARK };
        bool isValid() const;

    public:
        Mark(int value = 0, char type = MARK);
        Mark(double value);

        Mark& operator+=(const Mark& other);
        Mark& operator-=(const Mark& other);
        Mark operator+(const Mark& other) const;
        Mark operator-(const Mark& other) const;
        Mark& operator/=(int other);
        Mark operator/(int other) const;
        Mark& operator=(int value);
        Mark& operator=(char type);

        double raw() const;
        operator int() const;
        operator double() const;
        operator const char* () const;
        operator bool() const;

        // --- Display method (Workshop 5) ---
        std::ostream& display(std::ostream& os = std::cout) const;

        // --- Friend operators for division ---
        friend double operator/(double value, const Mark& M);
        friend int operator/(int value, const Mark& M);
    };

    // --- Helper functions and operator overloads (non-member) ---
    std::ostream& display(const Mark& M, char type, std::ostream& os = std::cout);
    std::ostream& operator<<(std::ostream& os, const Mark& M);
    std::istream& operator>>(std::istream& is, Mark& M);
    std::ifstream& operator>>(std::ifstream& ifs, Mark& M);
    double operator+(double left, const Mark& right);
    int operator+(int left, const Mark& right);
    double operator-(double left, const Mark& right);
    int operator-(int left, const Mark& right);

}

#endif // !SENECA_MARK_H
