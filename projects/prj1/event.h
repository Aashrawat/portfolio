/*Name: Aashrawat Shrestha
Email: ashrestha73@myseneca.ca
Student ID: 179413232
DATE: JAN30
*/
#ifndef SENECA_EVENT_H
#define SENECA_EVENT_H
#include<chrono>
#include<string>
#include<iostream>
namespace seneca {
	class Event {
		std::string m_eventName{};
		std::chrono::nanoseconds m_duration{};
	public:
		Event()=default;
		Event(const char* name, const std::chrono::nanoseconds& duration);
		friend std::ostream& operator<<(std::ostream& os, const Event& event);
	};
}

#endif //SENECA_EVENT_H

