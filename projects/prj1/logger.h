/*Name: Aashrawat Shrestha
Email: ashrestha73@myseneca.ca
Student ID: 179413232
DATE: JAN30
*/
#define _CRT_SECURE_NO_WARNINGS
#ifndef SENECA_LOGGER_H
#define SENECA_LOGGER_H
#include<iostream>
#include "event.h"
namespace seneca {
	class Logger {
		Event* m_events{nullptr};
		size_t m_size{ 0 };
	public:
		Logger()=default;
		~Logger();

		//disable copy operations

		Logger(const Logger&) = delete;//copy constructor
		Logger& operator=(const Logger&) = delete;//copy assignment

		//move operations
		Logger(Logger&& other) noexcept;//move constructor
		Logger& operator=(Logger&& other) noexcept;//move assignment


		//member function
		void addEvent(const Event& event);

		//friend helper
		friend std::ostream& operator<<(std::ostream& os, const Logger& logger);

	};
}
#endif
