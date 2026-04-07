/*Name: Aashrawat Shrestha
Email: ashrestha73@myseneca.ca
Student ID: 179413232
DATE: march29
*/
#ifndef SENECA_SETTINGS_H
#define SENECA_SETTINGS_H

namespace seneca {
    struct Settings {
        short m_maxSummaryWidth{ 80 };
        bool m_tableView{ false };
    };

    extern Settings g_settings;
}

#endif
