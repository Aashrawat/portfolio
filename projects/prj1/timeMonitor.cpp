/*Name: Aashrawat Shrestha
Email: ashrestha73@myseneca.ca
Student ID: 179413232
DATE: JAN30
*/
#include "timeMonitor.h"

namespace seneca {

    void TimeMonitor::startEvent(const char* name) {
        m_eventName = name;
        m_startTime = std::chrono::steady_clock::now();
    }

    Event TimeMonitor::stopEvent() {
        auto endTime = std::chrono::steady_clock::now();
        auto duration = 
            std::chrono::duration_cast<std::chrono::nanoseconds>(endTime - m_startTime);

        return Event(m_eventName, duration);
    }

}
