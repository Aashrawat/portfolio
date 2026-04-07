/*Name: Aashrawat Shrestha
Email: ashrestha73@myseneca.ca
Student ID: 179413232
DATE: JAN30
*/
#ifndef SENECA_TIMEMONITOR_H
#define SENECA_TIMEMONITOR_H

#include<chrono>
#include<string>
#include"event.h"
namespace seneca {
	class TimeMonitor {
		std::chrono::steady_clock::time_point m_startTime{};
		const char* m_eventName{nullptr};
	public:
		void startEvent(const char* name);
		Event stopEvent();

	};
}
#endif
