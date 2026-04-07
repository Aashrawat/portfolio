/*Name: Aashrawat Shrestha
Email: ashrestha73@myseneca.ca
Student ID: 179413232
DATE: JAN30
*/
#include "event.h"
#include "settings.h"
#include <iomanip>

namespace seneca {

    Event::Event(const char* name, const std::chrono::nanoseconds& duration)
        : m_eventName(name ? name : ""), m_duration(duration) {
    }

    std::ostream& operator<<(std::ostream& os, const Event& event) {
        static int counter = 0;
        counter++;

        long long duration = 0;
        int fieldWidth = 0;

        if (g_settings.m_time_units == "Seconds") {
            duration = std::chrono::duration_cast<std::chrono::seconds>(event.m_duration).count();
            fieldWidth = 2;
        }
        else if (g_settings.m_time_units == "milliseconds") {
            duration = std::chrono::duration_cast<std::chrono::milliseconds>(event.m_duration).count();
            fieldWidth = 5;
        }
        else if (g_settings.m_time_units == "microseconds") {
            duration = std::chrono::duration_cast<std::chrono::microseconds>(event.m_duration).count();
            fieldWidth = 8;
        }
        else { 
            duration = event.m_duration.count();
            fieldWidth = 11;
        }

        os << std::setw(2) << std::right << counter << ": "
            << std::setw(40) << std::right << event.m_eventName << " -> "
            << std::setw(fieldWidth) << std::right << duration << " "
            << g_settings.m_time_units;

        return os;
    }

}
