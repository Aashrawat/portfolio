/*Name: Aashrawat Shrestha
Email: ashrestha73@myseneca.ca
Student ID: 179413232
DATE: JAN30
*/
#include "logger.h"

namespace seneca {

   
    Logger::~Logger() {
        delete[] m_events;
    }

    Logger::Logger(Logger&& other) noexcept {
        *this = std::move(other);
    }
    Logger& Logger::operator=(Logger&& other) noexcept {
        if (this != &other) {
            delete[] m_events;

            m_events = other.m_events;
            m_size = other.m_size;

            other.m_events = nullptr;
            other.m_size = 0;
        }
        return *this;
    }

    void Logger::addEvent(const Event& event) {
        Event* temp = new Event[m_size + 1];

        for (size_t i = 0; i < m_size; ++i) {
            temp[i] = m_events[i];
        }

        temp[m_size] = event;

        delete[] m_events;
        m_events = temp;
        ++m_size;
    }

    std::ostream& operator<<(std::ostream& os, const Logger& logger) {
        for (size_t i = 0; i < logger.m_size; ++i) {
            os << logger.m_events[i] << std::endl;
        }
        return os;
    }

}
