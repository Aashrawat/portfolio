/*Name: Aashrawat Shrestha
Email: ashrestha73@myseneca.ca
Student ID: 179413232
DATE: JAN30
*/
#ifndef SENECA_SETTINGS_H
#define SENECA_SETTINGS_H

#include<string>
 namespace seneca {
	struct Settings {
		bool m_show_all = false; //default value false
		bool m_verbose = false; //default value false
		std::string m_time_units = "nanoseconds"; //default value nanoseconds

	};
	extern Settings g_settings;
}


#endif